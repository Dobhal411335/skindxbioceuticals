import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { EnquiryCreatePayload } from "@/types/enquiry";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

export async function createContactEnquiry(
  payload: EnquiryCreatePayload,
): Promise<void> {
  await apiClient.post<ApiSuccess<unknown>>(
    API_ENDPOINTS.ENQUIRIES.PUBLIC(STOREFRONT_SITE_CODE),
    payload,
  );
}
