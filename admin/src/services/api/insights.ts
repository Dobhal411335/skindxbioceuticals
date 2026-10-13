import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  InsightsConfigDto,
  InsightsConfigPayload,
} from "@/types/insights";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type MediaUploadResponse = {
  media?: { id?: string; url?: string; publicId?: string | null };
  result?: { publicId?: string; url?: string; secureUrl?: string };
  url?: string;
  secureUrl?: string;
  publicId?: string;
};

function preferHttpsUrl(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

export function resolveInsightsMediaUpload(data: MediaUploadResponse): {
  url: string;
  publicId: string;
} {
  const url = preferHttpsUrl(
    (
      data.result?.secureUrl ||
      data.media?.url ||
      data.result?.url ||
      data.secureUrl ||
      data.url ||
      ""
    ).trim(),
  );
  const publicId = (
    data.result?.publicId ||
    data.media?.publicId ||
    data.publicId ||
    ""
  ).trim();
  return { url, publicId };
}

export async function fetchInsightsConfig(
  siteCode: SiteCode,
): Promise<InsightsConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<InsightsConfigDto>>(
    endpoints.admin.insights(siteCode),
  );
  return data.data;
}

export async function upsertInsightsConfig(
  siteCode: SiteCode,
  body: InsightsConfigPayload,
): Promise<InsightsConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<InsightsConfigDto>>(
    endpoints.admin.insights(siteCode),
    body,
  );
  return data.data;
}

export async function uploadInsightsImage(
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
        feature: "insights",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveInsightsMediaUpload(data.data);
}
