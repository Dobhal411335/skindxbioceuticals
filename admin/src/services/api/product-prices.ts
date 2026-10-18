import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  AdminProductPriceApplyBody,
  AdminProductPriceApplyResult,
  AdminProductPriceListQuery,
  AdminProductPriceListResult,
} from "@/types/product-prices";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export async function fetchAdminProductPrices(
  siteCode: SiteCode,
  query: AdminProductPriceListQuery = {},
): Promise<AdminProductPriceListResult> {
  const { data } = await apiClient.get<
    ApiSuccess<AdminProductPriceListResult["items"]> & {
      meta: AdminProductPriceListResult["meta"];
    }
  >(endpoints.admin.productPrices(siteCode), {
    params: {
      q: query.q,
      status: query.status,
      categoryId: query.categoryId,
      subcategoryId: query.subcategoryId,
      productId: query.productId,
      percent: query.percent,
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

export async function applyAdminProductPrices(
  siteCode: SiteCode,
  body: AdminProductPriceApplyBody,
): Promise<AdminProductPriceApplyResult> {
  const { data } = await apiClient.post<
    ApiSuccess<AdminProductPriceApplyResult>
  >(endpoints.admin.productPricesApply(siteCode), body);
  return data.data;
}
