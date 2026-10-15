import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AdminOrderLogKind } from './admin-orders.types';

const orderListInclude = {
  user: { select: { email: true } },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      status: true,
      method: true,
    },
  },
  items: {
    select: { quantity: true },
  },
} satisfies Prisma.OrderInclude;

export type AdminOrderLogRow = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;

export class AdminOrdersRepository {
  protected readonly db = prisma;

  private buildWhere(
    siteId: string,
    kind: AdminOrderLogKind,
    options?: { range?: { from: Date; to: Date }; q?: string },
  ): Prisma.OrderWhereInput {
    const q = options?.q?.trim();
    const where: Prisma.OrderWhereInput = {
      siteId,
      ...(options?.range
        ? {
            createdAt: {
              gte: options.range.from,
              lte: options.range.to,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' as const } },
              { contactEmail: { contains: q, mode: 'insensitive' as const } },
              {
                user: {
                  email: { contains: q, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    if (kind === 'online') {
      where.payments = {
        some: {
          method: { not: 'COD' },
        },
      };
    } else {
      // Cancel Order workspace: unpaid / pending-payment orders (not already closed).
      where.status = { notIn: ['CANCELLED', 'REFUNDED'] };
      where.payments = {
        some: {
          status: 'PENDING',
        },
      };
    }

    return where;
  }

  async countForSite(
    siteId: string,
    kind: AdminOrderLogKind,
    options?: { range?: { from: Date; to: Date }; q?: string },
  ): Promise<number> {
    return this.db.order.count({
      where: this.buildWhere(siteId, kind, options),
    });
  }

  async listForSite(
    siteId: string,
    kind: AdminOrderLogKind,
    input: {
      page: number;
      pageSize: number;
      range?: { from: Date; to: Date };
      q?: string;
    },
  ): Promise<AdminOrderLogRow[]> {
    return this.db.order.findMany({
      where: this.buildWhere(siteId, kind, {
        range: input.range,
        q: input.q,
      }),
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });
  }
}

export const adminOrdersRepository = new AdminOrdersRepository();
