import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  VendorApplicationDetail,
  VendorApplicationListItem,
  VendorApplicationStatus,
  VendorApplicationStatusPatchResult,
  VendorCredential,
  VendorCredentialMutateResult,
} from "@/types/vendors";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchVendorApplications(
  siteCode: SiteCode,
  params: { status?: VendorApplicationStatus | "all"; q?: string } = {},
): Promise<VendorApplicationListItem[]> {
  const { data } = await apiClient.get<ApiSuccess<VendorApplicationListItem[]>>(
    endpoints.admin.vendorApplications(siteCode),
    { params },
  );
  return data.data;
}

export async function fetchVendorApplication(
  siteCode: SiteCode,
  applicationId: string,
): Promise<VendorApplicationDetail> {
  const { data } = await apiClient.get<ApiSuccess<VendorApplicationDetail>>(
    endpoints.admin.vendorApplication(siteCode, applicationId),
  );
  return data.data;
}

export async function patchVendorApplicationStatus(
  siteCode: SiteCode,
  applicationId: string,
  body: { status: VendorApplicationStatus; notes?: string | null },
): Promise<VendorApplicationStatusPatchResult> {
  const { data } = await apiClient.patch<
    ApiSuccess<VendorApplicationStatusPatchResult>
  >(endpoints.admin.vendorApplicationStatus(siteCode, applicationId), body);
  return data.data;
}

export async function fetchVendorCredentials(
  siteCode: SiteCode,
  params: { q?: string; isActive?: "true" | "false" | "all" } = {},
): Promise<VendorCredential[]> {
  const { data } = await apiClient.get<ApiSuccess<VendorCredential[]>>(
    endpoints.admin.vendorCredentials(siteCode),
    { params },
  );
  return data.data;
}

export async function patchVendorCredentialActive(
  siteCode: SiteCode,
  applicationId: string,
  isActive: boolean,
): Promise<VendorCredential> {
  const { data } = await apiClient.patch<ApiSuccess<VendorCredential>>(
    endpoints.admin.vendorCredentialActive(siteCode, applicationId),
    { isActive },
  );
  return data.data;
}

export async function regenerateVendorPassword(
  siteCode: SiteCode,
  applicationId: string,
): Promise<VendorCredentialMutateResult> {
  const { data } = await apiClient.post<ApiSuccess<VendorCredentialMutateResult>>(
    endpoints.admin.vendorCredentialRegenerate(siteCode, applicationId),
  );
  return data.data;
}
