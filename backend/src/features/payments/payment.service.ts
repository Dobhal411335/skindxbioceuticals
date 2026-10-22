import { createHash, randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { authRepository } from '@/features/auth/auth.repository';
import {priceCheckoutLines,sumCheckoutTotals} from '@/features/checkout/checkout.pricing';
import { guestCheckoutService } from '@/features/checkout/guest-checkout.service';
import { env } from '@/config/env';
import { sha256 } from '@/lib/crypto';
import { emailService } from '@/lib/email';
import {
  createRazorpayOrder,
  getRazorpayPublicKeyId,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '@/lib/integrations/razorpay.client';
import { logger } from '@/lib/logger';
import { decimalToString, paiseToRupeesDecimal, rupeesToPaise } from '@/lib/money';
import { prisma } from '@/lib/prisma';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import { paymentRepository } from './payment.repository';
import type {
  CreatePaymentOrderResult,
  OrderConfirmationResult,
  PaymentStatusResult,
  VerifyPaymentResult,
} from './payment.types';
import type { CreatePaymentOrderBody, VerifyPaymentBody } from './payment.validation';

const ECOMMERCE_SITE_CODE = 'IN' as const;

function canonicalRequestHash(body: CreatePaymentOrderBody): string {
  const normalized = {
    items: [...body.items]
      .map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
      .sort((a, b) => a.variantId.localeCompare(b.variantId)),
    shippingAddress: body.shippingAddress,
    billingAddress: body.billingAddress ?? null,
    notes: body.notes ?? null,
  };
  return sha256(JSON.stringify(normalized));
}

function nextOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return `SK-${stamp}${rand}`.slice(0, 24);
}

export class PaymentService {
  constructor(
    private readonly repository = paymentRepository,
    private readonly users = authRepository,
    private readonly guests = guestCheckoutService,
    private readonly mail = emailService,
  ) {}

  async createOrder(input: {
    body: CreatePaymentOrderBody;
    userId?: string;
    idempotencyKey: string;
  }): Promise<CreatePaymentOrderResult> {
    this.validateIdempotencyKey(input.idempotencyKey);

    const actor = await this.resolveCheckoutActor(input.body, input.userId);
    const requestHash = canonicalRequestHash(input.body);
    const scope = actor.idempotencyScope;

    const existing = await this.repository.findByIdempotency(scope, input.idempotencyKey);
    if (existing) {
      if (existing.requestHash && existing.requestHash !== requestHash) {
        throw new ConflictError('Idempotency key reused with different checkout payload');
      }
      if (existing.providerOrderId && existing.status !== 'FAILED') {
        let confirmationToken: string | undefined;
        if (actor.kind === 'guest') {
          confirmationToken = await this.guests.issueConfirmationToken(actor.session.id);
        }
        return {
          orderId: existing.orderId,
          orderNumber: existing.order.orderNumber,
          razorpayOrderId: existing.providerOrderId,
          amountInPaise: existing.amountInPaise,
          currency: existing.currency,
          keyId: getRazorpayPublicKeyId(),
          paymentId: existing.id,
          status: existing.status,
          confirmationToken,
        };
      }
    }

    const site = await prisma.site.findFirst({
      where: { code: ECOMMERCE_SITE_CODE, isActive: true },
    });
    if (!site) {
      throw new AppError('Ecommerce site is not configured', 500);
    }

    const quantities = new Map<string, number>();
    for (const line of input.body.items) {
      quantities.set(line.variantId, (quantities.get(line.variantId) ?? 0) + line.quantity);
    }
    const variantIds = [...quantities.keys()];

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        product: {
          siteId: site.id,
          status: 'ACTIVE',
        },
      },
      include: {
        inventory: true,
        product: {
          include: {
            tax: true,
            coupon: { include: { coupon: true } },
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new ValidationError('One or more products are unavailable');
    }

    for (const variant of variants) {
      const qty = quantities.get(variant.id) ?? 0;
      const onHand = variant.inventory?.quantityOnHand ?? 0;
      const reserved = variant.inventory?.quantityReserved ?? 0;
      const available = onHand - reserved;
      if (qty > available) {
        throw new ConflictError(`Insufficient stock for ${variant.product.name}`);
      }
    }

    const lines = priceCheckoutLines(variants, quantities, {
      isVendor: actor.kind === 'user' && actor.isVendor,
    });
    const totals = sumCheckoutTotals(lines);
    const amountInPaise = rupeesToPaise(totals.grandTotal);
    if (amountInPaise < 100) {
      throw new ValidationError('Order total is too low for payment');
    }

    const orderNumber = nextOrderNumber();

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          siteId: site.id,
          orderNumber,
          userId: actor.kind === 'user' ? actor.userId : null,
          contactEmail: actor.contactEmail,
          status: 'PENDING',
          currency: 'INR',
          subtotal: new Prisma.Decimal(totals.subtotal.toFixed(2)),
          discountTotal: new Prisma.Decimal(totals.discountTotal.toFixed(2)),
          shippingTotal: new Prisma.Decimal(totals.shippingTotal.toFixed(2)),
          taxTotal: new Prisma.Decimal(totals.taxTotal.toFixed(2)),
          cgstTotal: new Prisma.Decimal(totals.cgstTotal.toFixed(2)),
          sgstTotal: new Prisma.Decimal(totals.sgstTotal.toFixed(2)),
          grandTotal: new Prisma.Decimal(totals.grandTotal.toFixed(2)),
          shippingAddress: input.body.shippingAddress,
          billingAddress: input.body.billingAddress ?? input.body.shippingAddress,
          notes: input.body.notes ?? null,
          prescriptionImageUrl: input.body.prescriptionImageUrl ?? null,
          items: {
            create: lines.map((line) => ({
              variantId: line.variantId,
              productName: line.productName,
              variantName: line.variantName,
              sku: line.sku,
              unitPrice: new Prisma.Decimal(line.unitPrice.toFixed(2)),
              originalUnitPrice: new Prisma.Decimal(line.originalUnitPrice.toFixed(2)),
              quantity: line.quantity,
              lineTotal: new Prisma.Decimal(line.linePayableTotal.toFixed(2)),
              cgstPercent: new Prisma.Decimal(line.cgstPercent.toFixed(2)),
              sgstPercent: new Prisma.Decimal(line.sgstPercent.toFixed(2)),
              cgstAmount: new Prisma.Decimal(line.lineCgst.toFixed(2)),
              sgstAmount: new Prisma.Decimal(line.lineSgst.toFixed(2)),
            })),
          },
        },
      });

      for (const line of lines) {
        const inv = await tx.inventoryItem.findUnique({ where: { variantId: line.variantId } });
        if (!inv) {
          throw new ConflictError(`Inventory missing for ${line.productName}`);
        }
        const available = inv.quantityOnHand - inv.quantityReserved;
        if (line.quantity > available) {
          throw new ConflictError(`Insufficient stock for ${line.productName}`);
        }
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: { quantityReserved: inv.quantityReserved + line.quantity },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: inv.id,
            type: 'RESERVATION',
            quantity: line.quantity,
            note: 'Checkout reservation',
            referenceType: 'order',
            referenceId: order.id,
          },
        });
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          method: 'OTHER',
          amount: paiseToRupeesDecimal(amountInPaise),
          amountInPaise,
          currency: 'INR',
          provider: 'razorpay',
          idempotencyKey: input.idempotencyKey,
          idempotencyScope: scope,
          requestHash,
        },
      });

      return { order, payment };
    });

    if (actor.kind === 'guest') {
      await this.guests.attachOrder(actor.session.id, created.order.id);
    }

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise,
        currency: 'INR',
        receipt: created.order.orderNumber,
        notes: {
          orderId: created.order.id,
          orderNumber: created.order.orderNumber,
        },
      });
    } catch {
      await this.repository.markPaymentFailed(created.payment.id, 'RAZORPAY_CREATE_FAILED');
      await this.releaseReservations(created.order.id);
      throw new AppError('Unable to start payment. Please try again.', 502);
    }

    await this.repository.updatePayment(created.payment.id, {
      providerOrderId: razorpayOrder.id,
      rawResponse: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });

    let confirmationToken: string | undefined;
    if (actor.kind === 'guest') {
      confirmationToken = await this.guests.issueConfirmationToken(actor.session.id);
    }

    logger.info(
      {
        event: 'payment.create_order.success',
        context: 'PAYMENT',
        orderId: created.order.id,
        paymentId: created.payment.id,
      },
      'Checkout payment order created',
    );

    return {
      orderId: created.order.id,
      orderNumber: created.order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amountInPaise,
      currency: 'INR',
      keyId: getRazorpayPublicKeyId(),
      paymentId: created.payment.id,
      status: 'PENDING',
      confirmationToken,
    };
  }

  async verifyPayment(input: {
    body: VerifyPaymentBody;
    userId?: string;
  }): Promise<VerifyPaymentResult> {
    const order = await prisma.order.findUnique({
      where: { id: input.body.orderId },
      include: { payments: { orderBy: { createdAt: 'desc' } }, items: true },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    await this.assertOrderAccess(order, input.userId, input.body.guestSessionToken);

    const payment =
      order.payments.find((p) => p.providerOrderId === input.body.razorpayOrderId) ??
      order.payments[0];
    if (!payment || payment.providerOrderId !== input.body.razorpayOrderId) {
      throw new ValidationError('Payment does not match this order');
    }

    if (payment.status === 'CAPTURED') {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: payment.status,
        orderStatus: 'CONFIRMED',
        alreadyProcessed: true,
        confirmationToken: await this.maybeGuestConfirmation(order, input.body.guestSessionToken),
      };
    }

    const valid = verifyCheckoutSignature({
      razorpayOrderId: input.body.razorpayOrderId,
      razorpayPaymentId: input.body.razorpayPaymentId,
      razorpaySignature: input.body.razorpaySignature,
    });
    if (!valid) {
      await this.repository.markPaymentFailed(payment.id, 'INVALID_SIGNATURE');
      throw new ValidationError('Invalid payment signature');
    }

    if (payment.amountInPaise <= 0) {
      throw new ValidationError('Invalid payment amount');
    }

    const { newlyCaptured } = await this.repository.transitionPaymentCaptured({
      paymentId: payment.id,
      orderId: order.id,
      providerPaymentId: input.body.razorpayPaymentId,
      rawResponse: {
        razorpayOrderId: input.body.razorpayOrderId,
        razorpayPaymentId: input.body.razorpayPaymentId,
        verifiedAt: new Date().toISOString(),
      },
    });

    if (newlyCaptured) {
      await this.sendConfirmationOnce(order.id);
    }

    const confirmationToken = await this.maybeGuestConfirmation(
      order,
      input.body.guestSessionToken,
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: 'CAPTURED',
      orderStatus: 'CONFIRMED',
      alreadyProcessed: !newlyCaptured,
      confirmationToken,
    };
  }

  async getStatus(input: {
    orderId: string;
    userId?: string;
    guestSessionToken?: string;
  }): Promise<PaymentStatusResult> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    await this.assertOrderAccess(order, input.userId, input.guestSessionToken);
    const payment = order.payments[0] ?? null;
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: payment?.status ?? null,
      orderStatus: order.status,
      grandTotal: decimalToString(order.grandTotal),
      currency: order.currency,
      paidAt: payment?.paidAt?.toISOString() ?? null,
    };
  }

  async getConfirmation(input: {
    orderId?: string;
    confirmationToken?: string;
    userId?: string;
  }): Promise<OrderConfirmationResult> {
    let orderId = input.orderId;

    if (input.confirmationToken) {
      const session = await this.guests.resolveConfirmationToken(input.confirmationToken);
      orderId = session.orderId ?? undefined;
    }

    if (!orderId) {
      throw new ValidationError('orderId or confirmationToken is required');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (input.confirmationToken) {
      // access already validated via token
    } else if (input.userId) {
      if (order.userId !== input.userId) {
        throw new NotFoundError('Order not found');
      }
    } else {
      throw new UnauthorizedError('Confirmation access required');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payments[0]?.status ?? null,
      currency: order.currency,
      subtotal: decimalToString(order.subtotal),
      discountTotal: decimalToString(order.discountTotal),
      shippingTotal: decimalToString(order.shippingTotal),
      taxTotal: decimalToString(order.taxTotal),
      cgstTotal: decimalToString(order.cgstTotal),
      sgstTotal: decimalToString(order.sgstTotal),
      grandTotal: decimalToString(order.grandTotal),
      contactEmail: order.contactEmail,
      placedAt: order.placedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        unitPrice: decimalToString(item.unitPrice),
        originalUnitPrice: item.originalUnitPrice
          ? decimalToString(item.originalUnitPrice)
          : null,
        quantity: item.quantity,
        lineTotal: decimalToString(item.lineTotal),
        cgstPercent: decimalToString(item.cgstPercent),
        sgstPercent: decimalToString(item.sgstPercent),
        cgstAmount: decimalToString(item.cgstAmount),
        sgstAmount: decimalToString(item.sgstAmount),
      })),
      shippingAddress: order.shippingAddress,
      prescriptionImageUrl: order.prescriptionImageUrl ?? null,
      isGuest: order.userId == null,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    let payload: {
      event?: string;
      id?: string;
      payload?: {
        payment?: { entity?: Record<string, unknown> };
        order?: { entity?: Record<string, unknown> };
      };
    };
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as typeof payload;
    } catch {
      throw new ValidationError('Invalid webhook payload');
    }

    const eventId = payload.id ?? createHash('sha256').update(rawBody).digest('hex');
    const eventType = payload.event ?? 'unknown';

    const isNew = await this.repository.recordWebhookEvent({
      provider: 'razorpay',
      providerEventId: eventId,
      eventType,
    });
    if (!isNew) {
      logger.info(
        { event: 'payment.webhook.duplicate', context: 'PAYMENT', eventType },
        'Duplicate Razorpay webhook ignored',
      );
      return;
    }

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;
      const providerOrderId =
        (paymentEntity?.order_id as string | undefined) ??
        (orderEntity?.id as string | undefined);
      const providerPaymentId = paymentEntity?.id as string | undefined;

      if (!providerOrderId) {
        logger.warn(
          { event: 'payment.webhook.missing_order', context: 'PAYMENT', eventType },
          'Webhook missing Razorpay order id',
        );
        return;
      }

      const payment = await this.repository.findByProviderOrderId(providerOrderId);
      if (!payment) {
        logger.warn(
          { event: 'payment.webhook.unknown_order', context: 'PAYMENT', providerOrderId },
          'Webhook for unknown payment order',
        );
        return;
      }

      if (payment.status === 'CAPTURED') {
        return;
      }

      const { newlyCaptured } = await this.repository.transitionPaymentCaptured({
        paymentId: payment.id,
        orderId: payment.orderId,
        providerPaymentId: providerPaymentId ?? `wh_${eventId}`,
        rawResponse: { webhookEvent: eventType, at: new Date().toISOString() },
      });

      if (newlyCaptured) {
        await this.sendConfirmationOnce(payment.orderId);
      }
      return;
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id as string | undefined;
      if (!providerOrderId) return;
      const payment = await this.repository.findByProviderOrderId(providerOrderId);
      if (!payment || payment.status === 'CAPTURED') return;
      await this.repository.markPaymentFailed(payment.id, 'WEBHOOK_PAYMENT_FAILED');
    }
  }

  private validateIdempotencyKey(key: string) {
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
      throw new ValidationError('Invalid Idempotency-Key');
    }
  }

  private async resolveCheckoutActor(body: CreatePaymentOrderBody, userId?: string) {
    if (userId) {
      const user = await this.users.findById(userId);
      const isVendor = user?.role === 'VENDOR';
      const isCustomer = user?.role === 'CUSTOMER';
      if (
        !user ||
        (!isCustomer && !isVendor) ||
        user.status !== 'ACTIVE' ||
        (!isVendor && !user.emailVerifiedAt)
      ) {
        throw new ForbiddenError('Verified customer or vendor account required');
      }
      return {
        kind: 'user' as const,
        userId: user.id,
        contactEmail: user.email.toLowerCase(),
        idempotencyScope: `user:${user.id}`,
        isVendor,
      };
    }

    if (!body.guestSessionToken) {
      throw new UnauthorizedError('Authentication or guest session required');
    }

    const session = await this.guests.requireVerifiedSession(body.guestSessionToken);
    return {
      kind: 'guest' as const,
      session,
      contactEmail: session.email,
      idempotencyScope: `guest:${session.id}`,
      isVendor: false as const,
    };
  }

  private async assertOrderAccess(
    order: { id: string; userId: string | null },
    userId?: string,
    guestSessionToken?: string,
  ) {
    if (userId && order.userId === userId) return;
    if (guestSessionToken) {
      const session = await this.guests.requireActiveSession(guestSessionToken);
      if (session.orderId === order.id) return;
    }
    throw new NotFoundError('Order not found');
  }

  private async maybeGuestConfirmation(
    order: { id: string; userId: string | null },
    guestSessionToken?: string,
  ): Promise<string | undefined> {
    if (!guestSessionToken || order.userId) return undefined;
    const session = await this.guests.requireActiveSession(guestSessionToken);
    if (session.orderId !== order.id) return undefined;
    return this.guests.issueConfirmationToken(session.id);
  }

  private async releaseReservations(orderId: string) {
    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({ where: { variantId: item.variantId } });
        if (!inv) continue;
        const release = Math.min(inv.quantityReserved, item.quantity);
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: { quantityReserved: Math.max(0, inv.quantityReserved - release) },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: inv.id,
            type: 'RELEASE',
            quantity: release,
            note: 'Payment create failed',
            referenceType: 'order',
            referenceId: orderId,
          },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }

  private async sendConfirmationOnce(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.confirmationEmailSentAt) return;

    const claimed = await prisma.order.updateMany({
      where: { id: orderId, confirmationEmailSentAt: null },
      data: { confirmationEmailSentAt: new Date() },
    });
    if (claimed.count === 0) return;

    const detailsUrl = `${env.SITE_IN_URL.replace(/\/$/, '')}/checkout/thank-you?orderId=${order.id}`;

    try {
      await this.mail.sendOrderConfirmationEmail({
        to: { email: order.contactEmail },
        siteCode: 'IN',
        orderReference: order.orderNumber,
        items: order.items.map((item) => ({
          name: `${item.productName} (${item.variantName})`,
          quantity: item.quantity,
          unitPrice: decimalToString(item.unitPrice),
          lineTotal: decimalToString(item.lineTotal),
        })),
        breakdown: {
          subtotal: decimalToString(order.subtotal),
          discount: decimalToString(order.discountTotal),
          shipping: decimalToString(order.shippingTotal),
          tax: decimalToString(order.taxTotal),
          cgst: decimalToString(order.cgstTotal),
          sgst: decimalToString(order.sgstTotal),
          total: decimalToString(order.grandTotal),
          currency: order.currency,
        },
        shippingAddress: order.shippingAddress as {
          name?: string;
          line1: string;
          line2?: string;
          city: string;
          state?: string;
          postalCode?: string;
          country: string;
        },
        orderDetailsUrl: detailsUrl,
      });
    } catch (error) {
      logger.error(
        {
          event: 'payment.confirmation_email.failed',
          context: 'PAYMENT',
          orderId,
          err: error instanceof Error ? error.message : 'unknown',
        },
        'Order confirmation email failed (payment not rolled back)',
      );
      // Clear flag so a later retry/webhook can try again
      await prisma.order.update({
        where: { id: orderId },
        data: { confirmationEmailSentAt: null },
      });
    }
  }
}

export const paymentService = new PaymentService();
