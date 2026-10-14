import { authRepository } from '@/features/auth/auth.repository';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/utils/AppError';
import { orderRepository } from './order.repository';
import type { OrderDetailDto, OrderListItemDto, PaginatedOrdersDto } from './order.types';
import type { ListOrdersQuery } from './order.validation';

function decimalToString(value: { toString(): string } | number | string): string {
  return typeof value === 'string' ? value : value.toString();
}

/**
 * Order service — customer order history scoped to the authenticated user.
 */
export class OrderService {
  constructor(
    private readonly repository = orderRepository,
    private readonly users = authRepository,
  ) {}

  async listOrders(userId: string, query: ListOrdersQuery): Promise<PaginatedOrdersDto> {
    await this.requireActiveCustomer(userId);
    const { page, pageSize } = query;
    const [total, rows] = await Promise.all([
      this.repository.countForUser(userId),
      this.repository.listForUser(userId, page, pageSize),
    ]);

    const orders: OrderListItemDto[] = rows.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      currency: order.currency,
      grandTotal: decimalToString(order.grandTotal),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      paymentStatus: order.payments[0]?.status ?? null,
      placedAt: order.placedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    }));

    return {
      orders,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getOrder(userId: string, orderId: string): Promise<OrderDetailDto> {
    await this.requireActiveCustomer(userId);
    const order = await this.repository.findForUser(userId, orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      currency: order.currency,
      subtotal: decimalToString(order.subtotal),
      discountTotal: decimalToString(order.discountTotal),
      shippingTotal: decimalToString(order.shippingTotal),
      taxTotal: decimalToString(order.taxTotal),
      grandTotal: decimalToString(order.grandTotal),
      paymentStatus: order.payments[0]?.status ?? null,
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
      })),
    };
  }

  private async requireActiveCustomer(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenError('Insufficient permissions');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }
    return user;
  }
}

export const orderService = new OrderService();
