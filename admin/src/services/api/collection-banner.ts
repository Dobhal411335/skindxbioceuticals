import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  CollectionBannerConfigDto,
  CollectionBannerConfigPayload,
} from "@/types/promo-collection-banners";

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

export function resolveCollectionMediaUpload(data: MediaUploadResponse): {
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

export async function fetchCollectionBannerConfig(
  siteCode: SiteCode,
): Promise<CollectionBannerConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<CollectionBannerConfigDto>>(
    endpoints.admin.collectionBanners(siteCode),
  );
  return data.data;
}

export async function upsertCollectionBannerConfig(
  siteCode: SiteCode,
  body: CollectionBannerConfigPayload,
): Promise<CollectionBannerConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<CollectionBannerConfigDto>>(
    endpoints.admin.collectionBanners(siteCode),
    body,
  );
  return data.data;
}

export async function uploadCollectionBannerImage(
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
        feature: "collection",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveCollectionMediaUpload(data.data);
}
