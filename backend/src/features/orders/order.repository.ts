import { prisma } from '@/lib/prisma';

const orderListInclude = {
  items: { select: { id: true, quantity: true } },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { status: true },
  },
};

const orderDetailInclude = {
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
  payments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { status: true },
  },
};

/**
 * Order repository — customer-owned order reads.
 */
export class OrderRepository {
  protected readonly db = prisma;

  async countForUser(userId: string, siteId: string): Promise<number> {
    return this.db.order.count({ where: { userId, siteId } });
  }

  async listForUser(userId: string, siteId: string, page: number, pageSize: number) {
    return this.db.order.findMany({
      where: { userId, siteId },
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async findForUser(userId: string, siteId: string, orderId: string) {
    return this.db.order.findFirst({
      where: { id: orderId, userId, siteId },
      include: orderDetailInclude,
    });
  }
}

export const orderRepository = new OrderRepository();
