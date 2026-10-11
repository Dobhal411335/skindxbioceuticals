import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  AboutUsBannerConfigDto,
  AboutUsBannerConfigPayload,
} from "@/types/about-us-banner";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type MediaUploadResponse = {
  media?: { id?: string; url?: string; publicId?: string | null };
  result?: { publicId?: string; url?: string; secureUrl?: string };
  /** Legacy flat shape — not used by current media API. */
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
export function resolveAboutUsMediaUpload(data: MediaUploadResponse): {
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

export async function fetchAboutUsBannerConfig(
  siteCode: SiteCode,
): Promise<AboutUsBannerConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<AboutUsBannerConfigDto>>(
    endpoints.admin.aboutUsBanner(siteCode),
  );
  return data.data;
}

export async function upsertAboutUsBannerConfig(
  siteCode: SiteCode,
  body: AboutUsBannerConfigPayload,
): Promise<AboutUsBannerConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<AboutUsBannerConfigDto>>(
    endpoints.admin.aboutUsBanner(siteCode),
    body,
  );
  return data.data;
}

export async function uploadAboutUsImage(
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
        feature: "about",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveAboutUsMediaUpload(data.data);
}
