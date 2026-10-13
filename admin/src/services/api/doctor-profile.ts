import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  DoctorProfileDto,
  DoctorProfilePayload,
} from "@/types/doctor-profile";

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

export async function fetchDoctorProfiles(
  siteCode: SiteCode,
): Promise<DoctorProfileDto[]> {
  const { data } = await apiClient.get<ApiSuccess<DoctorProfileDto[]>>(
    endpoints.admin.doctors(siteCode),
  );
  return data.data;
}

export async function createDoctorProfile(
  siteCode: SiteCode,
  body: DoctorProfilePayload,
): Promise<DoctorProfileDto> {
  const { data } = await apiClient.post<ApiSuccess<DoctorProfileDto>>(
    endpoints.admin.doctors(siteCode),
    body,
  );
  return data.data;
}

export async function updateDoctorProfile(
  siteCode: SiteCode,
  doctorId: string,
  body: DoctorProfilePayload,
): Promise<DoctorProfileDto> {
  const { data } = await apiClient.put<ApiSuccess<DoctorProfileDto>>(
    endpoints.admin.doctor(siteCode, doctorId),
    body,
  );
  return data.data;
}

export async function patchDoctorProfile(
  siteCode: SiteCode,
  doctorId: string,
  body: { active?: boolean; order?: number },
): Promise<DoctorProfileDto> {
  const { data } = await apiClient.patch<ApiSuccess<DoctorProfileDto>>(
    endpoints.admin.doctor(siteCode, doctorId),
    body,
  );
  return data.data;
}

export async function deleteDoctorProfile(
  siteCode: SiteCode,
  doctorId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.doctor(siteCode, doctorId));
}

export async function uploadDoctorPhoto(
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
