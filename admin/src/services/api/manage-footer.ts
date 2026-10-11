import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  FooterConfigDto,
  FooterConfigPayload,
} from "@/types/manage-footer";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchFooterConfig(
  siteCode: SiteCode,
): Promise<FooterConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<FooterConfigDto>>(
    endpoints.admin.footer(siteCode),
  );
  return data.data;
}

export async function upsertFooterConfig(
  siteCode: SiteCode,
  body: FooterConfigPayload,
): Promise<FooterConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<FooterConfigDto>>(
    endpoints.admin.footer(siteCode),
    body,
  );
  return data.data;
}
