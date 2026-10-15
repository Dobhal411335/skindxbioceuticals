import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ValidationError } from '@/utils/AppError';
import {
  adminOrdersRepository,
  type AdminOrderLogRow,
} from './admin-orders.repository';
import type {
  AdminOrderLogItemDto,
  AdminOrderLogKind,
  AdminOrderLogPageDto,
} from './admin-orders.types';
import {
  resolveAdminOrderLogDayRange,
  type AdminOrderLogQuery,
} from './admin-orders.validation';

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
}

export const adminOrdersService = new AdminOrdersService();
