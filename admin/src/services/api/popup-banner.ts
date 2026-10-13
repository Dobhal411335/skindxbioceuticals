import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  PopupBannerConfigDto,
  PopupBannerConfigPayload,
} from "@/types/popup-banner";

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

/** Map media upload API `{ media, result }` into form image fields. */
export function resolvePopupMediaUpload(data: MediaUploadResponse): {
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

export async function fetchPopupBannerConfig(
  siteCode: SiteCode,
): Promise<PopupBannerConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<PopupBannerConfigDto>>(
    endpoints.admin.popupBanner(siteCode),
  );
  return data.data;
}

export async function upsertPopupBannerConfig(
  siteCode: SiteCode,
  body: PopupBannerConfigPayload,
): Promise<PopupBannerConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<PopupBannerConfigDto>>(
    endpoints.admin.popupBanner(siteCode),
    body,
  );
  return data.data;
}

export async function uploadPopupBannerImage(
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
        feature: "popup",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolvePopupMediaUpload(data.data);
}
