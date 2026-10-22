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

const adminOrderDetailInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      status: true,
      method: true,
      amount: true,
      currency: true,
      provider: true,
      providerOrderId: true,
      paidAt: true,
      createdAt: true,
    },
  },
  items: {
    include: {
      variant: {
        select: {
          product: {
            select: {
              media: {
                where: { isPrimary: true },
                take: 1,
                select: {
                  media: {
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type AdminOrderDetailRow = Prisma.OrderGetPayload<{
  include: typeof adminOrderDetailInclude;
}>;

const orderEnquiryInclude = adminOrderDetailInclude;

export type AdminOrderEnquiryRow = AdminOrderDetailRow;

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
          status: 'CAPTURED',
          method: { not: 'COD' },
        },
      };
      where.NOT = {
        user: {
          role: 'VENDOR',
        },
      };
    } else if (kind === 'vendor') {
      where.payments = {
        some: {
          status: 'CAPTURED',
        },
      };
      where.user = {
        role: 'VENDOR',
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

  private buildEnquiryWhere(
    siteId: string,
    options?: {
      range?: { from: Date; to: Date };
      q?: string;
      status?: string;
    },
  ): Prisma.OrderWhereInput {
    const q = options?.q?.trim();
    const where: Prisma.OrderWhereInput = {
      siteId,
      // Only include orders whose payment status is complete/captured (no pending payments)
      payments: {
        some: {
          status: 'CAPTURED',
        },
      },
      ...(options?.range
        ? {
            createdAt: {
              gte: options.range.from,
              lte: options.range.to,
            },
          }
        : {}),
      ...(options?.status && options.status !== 'ALL'
        ? { status: options.status as Prisma.EnumOrderStatusFilter['equals'] }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' as const } },
              { contactEmail: { contains: q, mode: 'insensitive' as const } },
              {
                user: {
                  OR: [
                    { email: { contains: q, mode: 'insensitive' as const } },
                    { firstName: { contains: q, mode: 'insensitive' as const } },
                    { lastName: { contains: q, mode: 'insensitive' as const } },
                  ],
                },
              },
              {
                items: {
                  some: {
                    productName: { contains: q, mode: 'insensitive' as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    return where;
  }

  async countEnquiryForSite(
    siteId: string,
    options?: { range?: { from: Date; to: Date }; q?: string; status?: string },
  ): Promise<number> {
    return this.db.order.count({
      where: this.buildEnquiryWhere(siteId, options),
    });
  }

  async listEnquiryForSite(
    siteId: string,
    input: {
      page: number;
      pageSize: number;
      range?: { from: Date; to: Date };
      q?: string;
      status?: string;
    },
  ): Promise<AdminOrderEnquiryRow[]> {
    return this.db.order.findMany({
      where: this.buildEnquiryWhere(siteId, {
        range: input.range,
        q: input.q,
        status: input.status,
      }),
      include: orderEnquiryInclude,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    });
  }

  async findDetailForSite(siteId: string, orderId: string): Promise<AdminOrderDetailRow | null> {
    return this.db.order.findFirst({
      where: { id: orderId, siteId },
      include: adminOrderDetailInclude,
    });
  }

  async updateOrderStatus(
    siteId: string,
    orderId: string,
    status: Prisma.EnumOrderStatusFilter['equals'],
    notes: string,
  ): Promise<AdminOrderDetailRow> {
    return this.db.order.update({
      where: { id: orderId, siteId },
      data: {
        status: status as any,
        notes,
      },
      include: adminOrderDetailInclude,
    });
  }
}

export const adminOrdersRepository = new AdminOrdersRepository();
