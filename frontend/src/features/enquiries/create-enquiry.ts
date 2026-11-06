import { storefrontSiteCode } from "@/config/site";
import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { EnquiryCreatePayload } from "@/types/enquiry";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};


export async function createContactEnquiry(
  payload: EnquiryCreatePayload,
): Promise<void> {
  await apiClient.post<ApiSuccess<unknown>>(
    API_ENDPOINTS.ENQUIRIES.PUBLIC(storefrontSiteCode),
    payload,
  );
}
