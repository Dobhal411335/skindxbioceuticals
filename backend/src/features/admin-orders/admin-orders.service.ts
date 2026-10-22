import { env } from '@/config/env';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import {
  adminOrdersRepository,
  type AdminOrderDetailRow,
  type AdminOrderEnquiryRow,
  type AdminOrderLogRow,
} from './admin-orders.repository';
import type {
  AdminOrderDetailDto,
  AdminOrderEnquiryItemDto,
  AdminOrderEnquiryPageDto,
  AdminOrderLogItemDto,
  AdminOrderLogKind,
  AdminOrderLogPageDto,
} from './admin-orders.types';
import {
  resolveAdminOrderLogDayRange,
  type AdminOrderEnquiryQuery,
  type AdminOrderLogQuery,
  type AdminOrderUpdateStatusBody,
} from './admin-orders.validation';

export function parseOrderNotes(rawNotes: string | null | undefined): {
  customerNotes: string | null;
  statusMessage: string | null;
  statusHistory: Array<{
    status: string;
    message: string | null;
    updatedAt: string;
  }>;
} {
  if (!rawNotes) {
    return { customerNotes: null, statusMessage: null, statusHistory: [] };
  }
  const trimmed = rawNotes.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        customerNotes: typeof parsed.customerNotes === 'string' ? parsed.customerNotes : null,
        statusMessage: typeof parsed.statusMessage === 'string' ? parsed.statusMessage : null,
        statusHistory: Array.isArray(parsed.statusHistory)
          ? parsed.statusHistory
          : Array.isArray(parsed.timeline)
            ? parsed.timeline
            : [],
      };
    } catch {
      // not valid json, treat as plain text note
    }
  }
  return {
    customerNotes: rawNotes,
    statusMessage: rawNotes,
    statusHistory: [],
  };
}

export function serializeOrderNotes(
  existingNotes: string | null | undefined,
  newStatus: string,
  newStatusMessage?: string | null,
): string {
  const current = parseOrderNotes(existingNotes);
  const now = new Date().toISOString();
  const history = [...current.statusHistory];
  if (newStatus) {
    history.push({
      status: newStatus,
      message: newStatusMessage || null,
      updatedAt: now,
    });
  }
  return JSON.stringify({
    customerNotes: current.customerNotes,
    statusMessage: newStatusMessage !== undefined ? newStatusMessage : current.statusMessage,
    statusHistory: history,
  });
}

export function toAdminOrderLogItemDto(row: AdminOrderLogRow): AdminOrderLogItemDto {
  const payment = row.payments[0] ?? null;
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    currency: row.currency,
    grandTotal: Number(row.grandTotal),
    taxTotal: Number(row.taxTotal),
    cgstTotal: Number(row.cgstTotal),
    sgstTotal: Number(row.sgstTotal),
    customerEmail: row.user?.email ?? row.contactEmail,
    paymentStatus: payment?.status ?? null,
    paymentMethod: payment?.method ?? null,
    itemCount: row.items.reduce((sum, item) => sum + item.quantity, 0),
    placedAt: row.placedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    cancelledAt: row.status === 'CANCELLED' ? row.updatedAt.toISOString() : null,
  };
}

export function toAdminOrderEnquiryItemDto(row: AdminOrderEnquiryRow): AdminOrderEnquiryItemDto {
  const detail = toAdminOrderDetailDto(row);
  const itemsSummary = row.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ');
  const itemCount = row.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...detail,
    itemCount,
    itemsSummary,
  };
}

export function toAdminOrderDetailDto(row: AdminOrderDetailRow): AdminOrderDetailDto {
  const payment = row.payments[0] ?? null;
  const parsed = parseOrderNotes(row.notes);

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    currency: row.currency,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discountTotal),
    shippingTotal: Number(row.shippingTotal),
    taxTotal: Number(row.taxTotal),
    cgstTotal: Number(row.cgstTotal),
    sgstTotal: Number(row.sgstTotal),
    grandTotal: Number(row.grandTotal),
    customerName: row.user
      ? [row.user.firstName, row.user.lastName].filter(Boolean).join(' ') || null
      : null,
    customerEmail: row.user?.email ?? row.contactEmail,
    customerPhone: row.user?.phone ?? null,
    userId: row.userId,
    shippingAddress: row.shippingAddress,
    billingAddress: row.billingAddress,
    placedAt: row.placedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paymentStatus: payment?.status ?? null,
    paymentMethod: payment?.method ?? null,
    paymentDetails: row.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amount: Number(p.amount),
      currency: p.currency,
      provider: p.provider,
      providerOrderId: p.providerOrderId,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    items: row.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      unitPrice: Number(item.unitPrice),
      originalUnitPrice: item.originalUnitPrice ? Number(item.originalUnitPrice) : null,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      cgstPercent: Number(item.cgstPercent),
      sgstPercent: Number(item.sgstPercent),
      cgstAmount: Number(item.cgstAmount),
      sgstAmount: Number(item.sgstAmount),
      image: item.variant?.product?.media?.[0]?.media?.url ?? null,
    })),
    statusMessage: parsed.statusMessage,
    customerNotes: parsed.customerNotes,
    prescriptionImageUrl: row.prescriptionImageUrl ?? null,
    statusHistory: parsed.statusHistory,
  };
}

export class AdminOrdersService {
  constructor(private readonly repository = adminOrdersRepository) {}

  async listForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    kind: AdminOrderLogKind;
    query: AdminOrderLogQuery;
  }): Promise<AdminOrderLogPageDto> {
    let dayRange: ReturnType<typeof resolveAdminOrderLogDayRange>;
    try {
      dayRange = resolveAdminOrderLogDayRange(input.query);
    } catch {
      throw new ValidationError('Invalid date filter');
    }

    const range =
      dayRange.mode === 'day' && dayRange.from && dayRange.to
        ? { from: dayRange.from, to: dayRange.to }
        : undefined;

    const listOptions = {
      range,
      q: input.query.q,
    };

    const [total, rows] = await Promise.all([
      this.repository.countForSite(input.siteId, input.kind, listOptions),
      this.repository.listForSite(input.siteId, input.kind, {
        page: input.query.page,
        pageSize: input.query.pageSize,
        ...listOptions,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / input.query.pageSize));

    logger.info(
      {
        event: 'admin_orders.list',
        siteCode: input.siteCode,
        kind: input.kind,
        page: input.query.page,
        pageSize: input.query.pageSize,
        filterMode: dayRange.mode,
        date: dayRange.date,
        hasSearch: Boolean(input.query.q),
        total,
      },
      'Admin order log listed',
    );

    return {
      siteCode: input.siteCode,
      kind: input.kind,
      filter: {
        mode: dayRange.mode,
        date: dayRange.date,
      },
      orders: rows.map(toAdminOrderLogItemDto),
      page: input.query.page,
      pageSize: input.query.pageSize,
      total,
      totalPages,
      hasMore: input.query.page < totalPages && rows.length > 0,
    };
  }

  async listEnquiryForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    query: AdminOrderEnquiryQuery;
  }): Promise<AdminOrderEnquiryPageDto> {
    let dayRange: ReturnType<typeof resolveAdminOrderLogDayRange>;
    try {
      dayRange = resolveAdminOrderLogDayRange(input.query);
    } catch {
      throw new ValidationError('Invalid date filter');
    }

    const range =
      dayRange.mode === 'day' && dayRange.from && dayRange.to
        ? { from: dayRange.from, to: dayRange.to }
        : undefined;

    const listOptions = {
      range,
      q: input.query.q,
      status: input.query.status,
    };

    const [total, rows] = await Promise.all([
      this.repository.countEnquiryForSite(input.siteId, listOptions),
      this.repository.listEnquiryForSite(input.siteId, {
        page: input.query.page,
        pageSize: input.query.pageSize,
        ...listOptions,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / input.query.pageSize));

    return {
      siteCode: input.siteCode,
      filter: {
        mode: dayRange.mode,
        date: dayRange.date,
        status: input.query.status,
      },
      orders: rows.map(toAdminOrderEnquiryItemDto),
      page: input.query.page,
      pageSize: input.query.pageSize,
      total,
      totalPages,
      hasMore: input.query.page < totalPages && rows.length > 0,
    };
  }

  async getDetailForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    orderId: string;
  }): Promise<AdminOrderDetailDto> {
    const row = await this.repository.findDetailForSite(input.siteId, input.orderId);
    if (!row) {
      throw new NotFoundError('Order not found');
    }
    return toAdminOrderDetailDto(row);
  }

  async updateStatusForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    orderId: string;
    body: AdminOrderUpdateStatusBody;
  }): Promise<AdminOrderDetailDto> {
    const existing = await this.repository.findDetailForSite(input.siteId, input.orderId);
    if (!existing) {
      throw new NotFoundError('Order not found');
    }

    const updatedNotes = serializeOrderNotes(
      existing.notes,
      input.body.status,
      input.body.message,
    );

    const updated = await this.repository.updateOrderStatus(
      input.siteId,
      input.orderId,
      input.body.status as any,
      updatedNotes,
    );

    // Send email to customer asynchronously
    const siteUrl = input.siteCode === 'IN' ? env.SITE_IN_URL : env.SITE_COM_URL;
    const trackingUrl = `${siteUrl.replace(/\/$/, '')}/account/orders/${updated.id}`;

    try {
      await emailService.sendOrderStatusEmail({
        to: {
          email: updated.contactEmail,
          name: updated.user
            ? [updated.user.firstName, updated.user.lastName].filter(Boolean).join(' ') || undefined
            : undefined,
        },
        siteCode: input.siteCode,
        orderReference: updated.orderNumber,
        statusLabel: input.body.status,
        orderDetailsUrl: trackingUrl,
        trackingUrl,
        statusMessage: input.body.message || null,
      });

      logger.info(
        {
          event: 'admin_orders.status_email_sent',
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          to: updated.contactEmail,
          newStatus: input.body.status,
        },
        'Order status update email dispatched',
      );
    } catch (emailErr) {
      logger.error(
        {
          err: emailErr,
          orderId: updated.id,
          orderNumber: updated.orderNumber,
        },
        'Failed to dispatch order status email to customer',
      );
    }

    return toAdminOrderDetailDto(updated);
  }
}

export const adminOrdersService = new AdminOrdersService();
