import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  TopAdvertisementConfigDto,
  TopAdvertisementConfigPayload,
} from "@/types/top-advertisement";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchTopAdvertisementConfig(
  siteCode: SiteCode,
): Promise<TopAdvertisementConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<TopAdvertisementConfigDto>>(
    endpoints.admin.topAdvertisement(siteCode),
  );
  return data.data;
}

export async function upsertTopAdvertisementConfig(
  siteCode: SiteCode,
  body: TopAdvertisementConfigPayload,
): Promise<TopAdvertisementConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<TopAdvertisementConfigDto>>(
    endpoints.admin.topAdvertisement(siteCode),
    body,
  );
  return data.data;
}
