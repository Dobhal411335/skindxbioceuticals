import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  AdminStockListQuery,
  AdminStockListResult,
  AdminStockVariantUpdateResult,
} from "@/types/stock-management";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export async function fetchAdminStock(
  siteCode: SiteCode,
  query: AdminStockListQuery = {},
): Promise<AdminStockListResult> {
  const { data } = await apiClient.get<
    ApiSuccess<AdminStockListResult["items"]> & {
      meta: AdminStockListResult["meta"];
    }
  >(endpoints.admin.stock(siteCode), {
    params: {
      q: query.q,
      status: query.status,
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      offset: query.offset,
      limit: query.limit,
      page: query.page,
    },
  });

  return {
    items: data.data,
    meta: data.meta ?? {
      page: 1,
      limit: query.limit ?? 10,
      total: data.data.length,
      totalPages: 1,
    },
  };
}

export async function updateStockVariantQty(
  siteCode: SiteCode,
  variantId: string,
  quantity: number,
): Promise<AdminStockVariantUpdateResult> {
  const { data } = await apiClient.patch<
    ApiSuccess<AdminStockVariantUpdateResult>
  >(endpoints.admin.stockVariant(siteCode, variantId), { quantity });
  return data.data;
}
