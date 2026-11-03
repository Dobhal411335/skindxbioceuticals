import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  EnquiryDto,
  EnquiryListParams,
  EnquiryStatusPatch,
} from "@/types/enquiry";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchEnquiries(
  siteCode: SiteCode,
  params: EnquiryListParams = {},
): Promise<EnquiryDto[]> {
  const { data } = await apiClient.get<ApiSuccess<EnquiryDto[]>>(
    endpoints.admin.enquiries(siteCode),
    { params },
  );
  return data.data;
}

export async function fetchEnquiry(
  siteCode: SiteCode,
  enquiryId: string,
): Promise<EnquiryDto> {
  const { data } = await apiClient.get<ApiSuccess<EnquiryDto>>(
    endpoints.admin.enquiry(siteCode, enquiryId),
  );
  return data.data;
}

export async function patchEnquiryStatus(
  siteCode: SiteCode,
  enquiryId: string,
  body: EnquiryStatusPatch,
): Promise<EnquiryDto> {
  const { data } = await apiClient.patch<ApiSuccess<EnquiryDto>>(
    endpoints.admin.enquiry(siteCode, enquiryId),
    body,
  );
  return data.data;
}
