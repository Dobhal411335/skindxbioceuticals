import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  BlogCreatePayload,
  BlogDto,
  BlogUpdatePayload,
} from "@/types/blog";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

type MediaUploadResponse = {
  media: { id: string; url: string; publicId?: string | null };
  result: { publicId: string; url?: string; secureUrl?: string };
};

export async function fetchBlogs(siteCode: SiteCode): Promise<BlogDto[]> {
  const { data } = await apiClient.get<ApiSuccess<BlogDto[]>>(
    endpoints.admin.blogs(siteCode),
  );
  return data.data;
}

export async function fetchBlog(
  siteCode: SiteCode,
  blogId: string,
): Promise<BlogDto> {
  const { data } = await apiClient.get<ApiSuccess<BlogDto>>(
    endpoints.admin.blog(siteCode, blogId),
  );
  return data.data;
}

export async function createBlog(
  siteCode: SiteCode,
  body: BlogCreatePayload,
): Promise<BlogDto> {
  const { data } = await apiClient.post<ApiSuccess<BlogDto>>(
    endpoints.admin.blogs(siteCode),
    body,
  );
  return data.data;
}

export async function updateBlog(
  siteCode: SiteCode,
  blogId: string,
  body: BlogUpdatePayload,
): Promise<BlogDto> {
  const { data } = await apiClient.put<ApiSuccess<BlogDto>>(
    endpoints.admin.blog(siteCode, blogId),
    body,
  );
  return data.data;
}

export async function patchBlog(
  siteCode: SiteCode,
  blogId: string,
  body: { name?: string; active?: boolean },
): Promise<BlogDto> {
  const { data } = await apiClient.patch<ApiSuccess<BlogDto>>(
    endpoints.admin.blog(siteCode, blogId),
    body,
  );
  return data.data;
}

export async function deleteBlog(
  siteCode: SiteCode,
  blogId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.blog(siteCode, blogId));
}

export async function uploadBlogImage(
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
        feature: "blog",
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
  return { url, publicId };
}
