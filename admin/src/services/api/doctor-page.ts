import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type { DoctorPageConfigDto, DoctorPagePayload } from "@/types/doctor-page";

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

export async function fetchDoctorPageConfig(
  siteCode: SiteCode,
): Promise<DoctorPageConfigDto> {
  const { data } = await apiClient.get<ApiSuccess<DoctorPageConfigDto>>(
    endpoints.admin.doctorPage(siteCode),
  );
  return data.data;
}

export async function upsertDoctorPageConfig(
  siteCode: SiteCode,
  body: DoctorPagePayload,
): Promise<DoctorPageConfigDto> {
  const { data } = await apiClient.put<ApiSuccess<DoctorPageConfigDto>>(
    endpoints.admin.doctorPage(siteCode),
    body,
  );
  return data.data;
}

export async function uploadDoctorPageImage(
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
        feature: "doctors",
        ...(entityId ? { entityId } : {}),
      },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resolveMediaUrl(data.data);
}
