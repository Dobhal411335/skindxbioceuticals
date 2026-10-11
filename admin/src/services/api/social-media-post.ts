import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  SocialPostDto,
  SocialPostPayload,
  SocialPostType,
} from "@/types/social-media-post";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result: { publicId: string; url?: string; secureUrl?: string };
};

export async function fetchSocialPosts(
  siteCode: SiteCode,
  postType?: SocialPostType,
): Promise<SocialPostDto[]> {
  const { data } = await apiClient.get<ApiSuccess<SocialPostDto[]>>(
    endpoints.admin.socialPosts(siteCode),
    { params: postType ? { postType } : undefined },
  );
  return data.data;
}

export async function createSocialPost(
  siteCode: SiteCode,
  body: SocialPostPayload,
): Promise<SocialPostDto> {
  const { data } = await apiClient.post<ApiSuccess<SocialPostDto>>(
    endpoints.admin.socialPosts(siteCode),
    body,
  );
  return data.data;
}

export async function updateSocialPost(
  siteCode: SiteCode,
  postId: string,
  body: SocialPostPayload,
): Promise<SocialPostDto> {
  const { data } = await apiClient.put<ApiSuccess<SocialPostDto>>(
    endpoints.admin.socialPost(siteCode, postId),
    body,
  );
  return data.data;
}

export async function patchSocialPost(
  siteCode: SiteCode,
  postId: string,
  body: { active?: boolean; order?: number },
): Promise<SocialPostDto> {
  const { data } = await apiClient.patch<ApiSuccess<SocialPostDto>>(
    endpoints.admin.socialPost(siteCode, postId),
    body,
  );
  return data.data;
}

export async function deleteSocialPost(
  siteCode: SiteCode,
  postId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.socialPost(siteCode, postId));
}

export async function uploadSocialPostImage(
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
        feature: "social",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const url =
    data.data.media.url ||
    data.data.result.url ||
    data.data.result.secureUrl ||
    "";
  const publicId = data.data.result.publicId || data.data.media.publicId || "";
  return { url, publicId };
}
