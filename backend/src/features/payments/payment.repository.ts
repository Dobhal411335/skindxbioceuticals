import type { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PaymentRepository {
  constructor(private readonly db = prisma) {}

  findByIdempotency(
    scope: string,
    key: string,
  ): Promise<(Payment & { order: { id: string; orderNumber: string; status: string; userId: string | null; contactEmail: string } }) | null> {
    return this.db.payment.findUnique({
      where: {
        idempotencyScope_idempotencyKey: {
          idempotencyScope: scope,
          idempotencyKey: key,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            userId: true,
            contactEmail: true,
          },
        },
      },
    });
  }

  findByProviderOrderId(providerOrderId: string) {
    return this.db.payment.findUnique({
      where: { providerOrderId },
      include: { order: true },
    });
  }

  findLatestForOrder(orderId: string) {
    return this.db.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.db.payment.findUnique({ where: { id }, include: { order: true } });
  }

  async recordWebhookEvent(input: {
    provider: string;
    providerEventId: string;
    eventType: string;
  }): Promise<boolean> {
    try {
      await this.db.webhookEvent.create({
        data: {
          provider: input.provider,
          providerEventId: input.providerEventId,
          eventType: input.eventType,
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  updatePayment(
    id: string,
    data: Prisma.PaymentUpdateInput,
  ): Promise<Payment> {
    return this.db.payment.update({ where: { id }, data });
  }

  async transitionPaymentCaptured(input: {
    paymentId: string;
    orderId: string;
    providerPaymentId: string;
    rawResponse?: Prisma.InputJsonValue;
  }): Promise<{ payment: Payment; newlyCaptured: boolean }> {
    return this.db.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id: input.paymentId } });
      if (!current) {
        throw new Error('Payment not found');
      }
      if (current.status === 'CAPTURED') {
        return { payment: current, newlyCaptured: false };
      }
      if (current.status === 'REFUNDED' || current.status === 'PARTIALLY_REFUNDED') {
        return { payment: current, newlyCaptured: false };
      }

      const payment = await tx.payment.update({
        where: { id: input.paymentId },
        data: {
          status: 'CAPTURED' satisfies PaymentStatus,
          providerPaymentId: input.providerPaymentId,
          paidAt: new Date(),
          ...(input.rawResponse !== undefined ? { rawResponse: input.rawResponse } : {}),
        },
      });

      await tx.order.updateMany({
        where: {
          id: input.orderId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: {
          status: 'CONFIRMED',
          placedAt: new Date(),
        },
      });

      // Inventory: convert reservation to stock-out once
      const items = await tx.orderItem.findMany({ where: { orderId: input.orderId } });
      for (const item of items) {
        const inv = await tx.inventoryItem.findUnique({ where: { variantId: item.variantId } });
        if (!inv) continue;

        const reserveRelease = Math.min(inv.quantityReserved, item.quantity);
        const nextReserved = Math.max(0, inv.quantityReserved - reserveRelease);
        const nextOnHand = Math.max(0, inv.quantityOnHand - item.quantity);

        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            quantityReserved: nextReserved,
            quantityOnHand: nextOnHand,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: inv.id,
            type: 'STOCK_OUT',
            quantity: item.quantity,
            note: 'Payment captured',
            referenceType: 'order',
            referenceId: input.orderId,
          },
        });
      }

      return { payment, newlyCaptured: true };
    });
  }

  async markPaymentFailed(paymentId: string, failureCode?: string) {
    return this.db.payment.updateMany({
      where: {
        id: paymentId,
        status: { in: ['PENDING', 'AUTHORIZED'] },
      },
      data: {
        status: 'FAILED',
        failureCode: failureCode ?? null,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
