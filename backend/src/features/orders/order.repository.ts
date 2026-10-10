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
  items: true,
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

  async countForUser(userId: string): Promise<number> {
    return this.db.order.count({ where: { userId } });
  }

  async listForUser(userId: string, page: number, pageSize: number) {
    return this.db.order.findMany({
      where: { userId },
      include: orderListInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async findForUser(userId: string, orderId: string) {
    return this.db.order.findFirst({
      where: { id: orderId, userId },
      include: orderDetailInclude,
    });
  }
}

export const orderRepository = new OrderRepository();
