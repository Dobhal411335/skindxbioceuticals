import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { CompanyBasicInfoDto } from "@/types/company-basic-info";
import type { SiteCode } from "@/types/auth";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchCompanyBasicInfo(
  siteCode: SiteCode,
): Promise<CompanyBasicInfoDto> {
  const { data } = await apiClient.get<ApiSuccess<CompanyBasicInfoDto>>(
    endpoints.admin.companyBasicInfo(siteCode),
  );
  return data.data;
}

export async function upsertCompanyBasicInfo(
  siteCode: SiteCode,
  body: Omit<
    CompanyBasicInfoDto,
    "id" | "siteCode" | "updatedAt"
  >,
): Promise<CompanyBasicInfoDto> {
  const { data } = await apiClient.put<ApiSuccess<CompanyBasicInfoDto>>(
    endpoints.admin.companyBasicInfo(siteCode),
    body,
  );
  return data.data;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result: { publicId: string; url?: string; secureUrl?: string };
};

export async function uploadCompanyLogo(
  siteCode: SiteCode,
  file: File,
  entityId?: string | null,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ApiSuccess<MediaUploadResponse>>(
    endpoints.media.uploadImage,
    formData,
    {
      params: {
        siteCode,
        feature: "branding",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const url = data.data.media.url || data.data.result.url || data.data.result.secureUrl || "";
  const publicId = data.data.result.publicId || data.data.media.publicId || "";
  return { url, publicId };
}
