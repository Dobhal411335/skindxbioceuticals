import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  WebpageContentUpdatePayload,
  WebpageCreatePayload,
  WebpageDto,
  WebpageListDto,
  WebpageMetaPatchPayload,
} from "@/types/webpages";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result: { publicId: string; url?: string; secureUrl?: string };
};

export async function fetchWebpages(
  siteCode: SiteCode,
): Promise<WebpageListDto[]> {
  const { data } = await apiClient.get<ApiSuccess<WebpageListDto[]>>(
    endpoints.admin.webpages(siteCode),
  );
  return data.data;
}

export async function fetchWebpage(
  siteCode: SiteCode,
  webpageId: string,
): Promise<WebpageDto> {
  const { data } = await apiClient.get<ApiSuccess<WebpageDto>>(
    endpoints.admin.webpage(siteCode, webpageId),
  );
  return data.data;
}

export async function createWebpage(
  siteCode: SiteCode,
  body: WebpageCreatePayload,
): Promise<WebpageDto> {
  const { data } = await apiClient.post<ApiSuccess<WebpageDto>>(
    endpoints.admin.webpages(siteCode),
    body,
  );
  return data.data;
}

export async function updateWebpageContent(
  siteCode: SiteCode,
  webpageId: string,
  body: WebpageContentUpdatePayload,
): Promise<WebpageDto> {
  const { data } = await apiClient.put<ApiSuccess<WebpageDto>>(
    endpoints.admin.webpage(siteCode, webpageId),
    body,
  );
  return data.data;
}

export async function patchWebpageMeta(
  siteCode: SiteCode,
  webpageId: string,
  body: WebpageMetaPatchPayload,
): Promise<WebpageDto> {
  const { data } = await apiClient.patch<ApiSuccess<WebpageDto>>(
    endpoints.admin.webpage(siteCode, webpageId),
    body,
  );
  return data.data;
}

export async function deleteWebpage(
  siteCode: SiteCode,
  webpageId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.webpage(siteCode, webpageId));
}

/** Upload a webpage image; maps Cloudinary publicId → asset key. */
export async function uploadWebpageImage(
  siteCode: SiteCode,
  file: File,
  entityId?: string | null,
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ApiSuccess<MediaUploadResponse>>(
    endpoints.media.uploadImage,
    formData,
    {
      params: {
        siteCode,
        feature: "webpage",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const url =
    data.data.result.secureUrl ||
    data.data.media.url ||
    data.data.result.url ||
    "";
  const publicId = data.data.result.publicId || data.data.media.publicId || "";
  return { url, key: publicId };
}
