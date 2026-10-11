import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  GalleryItemDto,
  GalleryItemPayload,
  GalleryMediaType,
} from "@/types/gallery";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result: { publicId: string; url?: string; secureUrl?: string };
};

function resolveMediaUrl(data: MediaUploadResponse): { url: string; publicId: string } {
  const url =
    data.result.secureUrl ||
    data.media.url ||
    data.result.url ||
    "";
  const publicId = data.result.publicId || data.media.publicId || "";
  return { url, publicId };
}

export async function fetchGalleryItems(
  siteCode: SiteCode,
  mediaType?: GalleryMediaType,
): Promise<GalleryItemDto[]> {
  const { data } = await apiClient.get<ApiSuccess<GalleryItemDto[]>>(
    endpoints.admin.gallery(siteCode),
    { params: mediaType ? { mediaType } : undefined },
  );
  return data.data;
}

export async function createGalleryItem(
  siteCode: SiteCode,
  body: GalleryItemPayload,
): Promise<GalleryItemDto> {
  const { data } = await apiClient.post<ApiSuccess<GalleryItemDto>>(
    endpoints.admin.gallery(siteCode),
    body,
  );
  return data.data;
}

export async function updateGalleryItem(
  siteCode: SiteCode,
  itemId: string,
  body: GalleryItemPayload,
): Promise<GalleryItemDto> {
  const { data } = await apiClient.put<ApiSuccess<GalleryItemDto>>(
    endpoints.admin.galleryItem(siteCode, itemId),
    body,
  );
  return data.data;
}

export async function patchGalleryItem(
  siteCode: SiteCode,
  itemId: string,
  body: { active?: boolean; order?: number },
): Promise<GalleryItemDto> {
  const { data } = await apiClient.patch<ApiSuccess<GalleryItemDto>>(
    endpoints.admin.galleryItem(siteCode, itemId),
    body,
  );
  return data.data;
}

export async function deleteGalleryItem(
  siteCode: SiteCode,
  itemId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.galleryItem(siteCode, itemId));
}

export async function uploadGalleryImage(
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
        feature: "gallery",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveMediaUrl(data.data);
}

export async function uploadGalleryVideo(
  siteCode: SiteCode,
  file: File,
  entityId?: string | null,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ApiSuccess<MediaUploadResponse>>(
    endpoints.media.uploadVideo,
    formData,
    {
      params: {
        siteCode,
        feature: "gallery",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveMediaUrl(data.data);
}
