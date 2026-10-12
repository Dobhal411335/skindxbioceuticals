import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type { FaqConfigDto, FaqConfigPayload } from "@/types/website-faq";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchFaqConfig(siteCode: SiteCode): Promise<FaqConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<FaqConfigDto>>(
    endpoints.admin.faq(siteCode),
  );
  return data.data;
}

export async function upsertFaqConfig(
  siteCode: SiteCode,
  body: FaqConfigPayload,
): Promise<FaqConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<FaqConfigDto>>(
    endpoints.admin.faq(siteCode),
    body,
  );
  return data.data;
}
