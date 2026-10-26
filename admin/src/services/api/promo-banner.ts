import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  PromoBannerConfigDto,
  PromoBannerConfigPayload,
} from "@/types/promo-collection-banners";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export async function fetchPromoBannerConfig(
  siteCode: SiteCode,
): Promise<PromoBannerConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<PromoBannerConfigDto>>(
    endpoints.admin.promoBanners(siteCode),
  );
  return data.data;
}
export async function upsertPromoBannerConfig(
  siteCode: SiteCode,
  body: PromoBannerConfigPayload,
): Promise<PromoBannerConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<PromoBannerConfigDto>>(
    endpoints.admin.promoBanners(siteCode),
    body,
  );
  return data.data;
}
