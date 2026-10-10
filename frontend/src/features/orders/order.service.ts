import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  CustomerOrderDetail,
  PaginatedOrders,
} from "@/features/orders/order.types";

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
};

export const orderService = {
  async list(params?: { page?: number; pageSize?: number }): Promise<PaginatedOrders> {
    const response = await apiClient.get<Envelope<PaginatedOrders>>(
      API_ENDPOINTS.ORDERS.LIST,
      { params },
    );
    return response.data.data;
  },

  async getById(orderId: string): Promise<CustomerOrderDetail> {
    const response = await apiClient.get<Envelope<{ order: CustomerOrderDetail }>>(
      API_ENDPOINTS.ORDERS.DETAIL(orderId),
    );
    return response.data.data.order;
  },
};
