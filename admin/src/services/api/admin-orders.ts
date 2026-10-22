import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  AdminOrderLogPage,
  AdminOrderLogQuery,
} from "@/types/admin-orders";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchOnlineOrderLog(
  siteCode: SiteCode,
  query: AdminOrderLogQuery = {},
): Promise<AdminOrderLogPage> {
  const { data } = await apiClient.get<ApiSuccess<AdminOrderLogPage>>(
    endpoints.admin.ordersOnlineLog(siteCode),
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        date: query.all ? undefined : query.date,
        all: query.all ? true : undefined,
        q: query.q || undefined,
      },
    },
  );
  return data.data;
}

export async function fetchCancelledOrderLog(
  siteCode: SiteCode,
  query: AdminOrderLogQuery = {},
): Promise<AdminOrderLogPage> {
  const { data } = await apiClient.get<ApiSuccess<AdminOrderLogPage>>(
    endpoints.admin.ordersCancelled(siteCode),
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        date: query.all ? undefined : query.date,
        all: query.all ? true : undefined,
        q: query.q || undefined,
      },
    },
  );
  return data.data;
}

export async function fetchVendorOrderLog(
  siteCode: SiteCode,
  query: AdminOrderLogQuery = {},
): Promise<AdminOrderLogPage> {
  const { data } = await apiClient.get<ApiSuccess<AdminOrderLogPage>>(
    endpoints.admin.ordersVendor(siteCode),
    {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        date: query.all ? undefined : query.date,
        all: query.all ? true : undefined,
        q: query.q || undefined,
      },
    },
  );
  return data.data;
}

export async function fetchEnquiryOrderLog(
  siteCode: SiteCode,
  query: import("@/types/admin-orders").AdminOrderEnquiryQuery = {},
): Promise<import("@/types/admin-orders").AdminOrderEnquiryPage> {
  const { data } = await apiClient.get<
    ApiSuccess<import("@/types/admin-orders").AdminOrderEnquiryPage>
  >(endpoints.admin.ordersEnquiry(siteCode), {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      date: query.all ? undefined : query.date,
      all: query.all ? true : undefined,
      status: query.status && query.status !== "ALL" ? query.status : undefined,
      q: query.q || undefined,
    },
  });
  return data.data;
}

export async function fetchAdminOrderDetail(
  siteCode: SiteCode,
  orderId: string,
): Promise<import("@/types/admin-orders").AdminOrderDetail> {
  const { data } = await apiClient.get<
    ApiSuccess<import("@/types/admin-orders").AdminOrderDetail>
  >(endpoints.admin.orderDetail(siteCode, orderId));
  return data.data;
}

export async function updateAdminOrderStatus(
  siteCode: SiteCode,
  orderId: string,
  payload: import("@/types/admin-orders").AdminOrderUpdateStatusPayload,
): Promise<import("@/types/admin-orders").AdminOrderDetail> {
  const { data } = await apiClient.patch<
    ApiSuccess<import("@/types/admin-orders").AdminOrderDetail>
  >(endpoints.admin.orderUpdateStatus(siteCode, orderId), payload);
  return data.data;
}
