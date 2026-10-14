import { apiClient } from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { DoctorAppointmentCreatePayload } from "@/types/doctors";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

const STOREFRONT_SITE_CODE = "IN" as const;

export async function createDoctorAppointment(
  payload: DoctorAppointmentCreatePayload,
): Promise<void> {
  await apiClient.post<ApiSuccess<unknown>>(
    API_ENDPOINTS.DOCTORS.APPOINTMENTS(STOREFRONT_SITE_CODE),
    payload,
  );
}
