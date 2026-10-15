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
