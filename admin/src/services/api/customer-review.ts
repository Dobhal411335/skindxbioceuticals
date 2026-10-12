import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  CustomerReviewDto,
  CustomerReviewPayload,
} from "@/types/customer-review";

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

export async function fetchCustomerReviews(
  siteCode: SiteCode,
): Promise<CustomerReviewDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CustomerReviewDto[]>>(
    endpoints.admin.customerReviews(siteCode),
  );
  return data.data;
}

export async function createCustomerReview(
  siteCode: SiteCode,
  body: CustomerReviewPayload,
): Promise<CustomerReviewDto> {
  const { data } = await apiClient.post<ApiSuccess<CustomerReviewDto>>(
    endpoints.admin.customerReviews(siteCode),
    body,
  );
  return data.data;
}

export async function updateCustomerReview(
  siteCode: SiteCode,
  reviewId: string,
  body: CustomerReviewPayload,
): Promise<CustomerReviewDto> {
  const { data } = await apiClient.put<ApiSuccess<CustomerReviewDto>>(
    endpoints.admin.customerReview(siteCode, reviewId),
    body,
  );
  return data.data;
}

export async function patchCustomerReview(
  siteCode: SiteCode,
  reviewId: string,
  body: { active?: boolean; order?: number },
): Promise<CustomerReviewDto> {
  const { data } = await apiClient.patch<ApiSuccess<CustomerReviewDto>>(
    endpoints.admin.customerReview(siteCode, reviewId),
    body,
  );
  return data.data;
}

export async function deleteCustomerReview(
  siteCode: SiteCode,
  reviewId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.customerReview(siteCode, reviewId));
}

export async function uploadCustomerReviewImage(
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
        feature: "reviews",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveMediaUrl(data.data);
}
