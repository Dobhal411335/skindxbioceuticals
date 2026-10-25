import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type { ClinicalConfidenceConfigDto, ClinicalConfidenceConfigPayload } from "@/types/clinical-confidence";

type ApiSuccess<T> = { success: true; message: string; data: T };
type UploadResponse = { media?: { url?: string; publicId?: string }; result?: { url?: string; secureUrl?: string; publicId?: string }; url?: string; secureUrl?: string; publicId?: string };

export async function fetchClinicalConfidence(siteCode: SiteCode) {
  const { data } = await apiClient.get<ApiSuccess<ClinicalConfidenceConfigDto>>(endpoints.admin.clinicalConfidence(siteCode));
  return data.data;
}
export async function upsertClinicalConfidence(siteCode: SiteCode, body: ClinicalConfidenceConfigPayload) {
  const { data } = await apiClient.put<ApiSuccess<ClinicalConfidenceConfigDto>>(endpoints.admin.clinicalConfidence(siteCode), body);
  return data.data;
}
export async function uploadClinicalConfidenceImage(siteCode: SiteCode, file: File, entityId?: string | null) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ApiSuccess<UploadResponse>>(endpoints.media.uploadImage, formData, { params: { siteCode, feature: "clinical-confidence", ...(entityId ? { entityId } : {}) }, headers: { "Content-Type": "multipart/form-data" } });
  const payload = data.data;
  return { url: (payload.result?.secureUrl || payload.result?.url || payload.media?.url || payload.secureUrl || payload.url || "").replace("http://res.cloudinary.com/", "https://res.cloudinary.com/"), publicId: (payload.result?.publicId || payload.media?.publicId || payload.publicId || "") };
}
