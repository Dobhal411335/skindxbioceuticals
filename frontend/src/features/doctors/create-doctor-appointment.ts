import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { DoctorAppointmentCreatePayload } from "@/types/doctors";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

export async function uploadDoctorMedicalHistoryImage(
  file: File,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<
    ApiSuccess<{ url: string; publicId: string }>
  >(API_ENDPOINTS.DOCTORS.MEDICAL_HISTORY_UPLOAD(STOREFRONT_SITE_CODE), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data;
}

export async function createDoctorAppointment(
  payload: DoctorAppointmentCreatePayload,
): Promise<void> {
  await apiClient.post<ApiSuccess<unknown>>(
    API_ENDPOINTS.DOCTORS.APPOINTMENTS(STOREFRONT_SITE_CODE),
    payload,
  );
}
