import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type {
  DoctorAppointmentDto,
  DoctorAppointmentListParams,
  DoctorAppointmentStatusPatch,
} from "@/types/doctor-appointment";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchDoctorAppointments(
  siteCode: SiteCode,
  params: DoctorAppointmentListParams = {},
): Promise<DoctorAppointmentDto[]> {
  const { data } = await apiClient.get<ApiSuccess<DoctorAppointmentDto[]>>(
    endpoints.admin.doctorAppointments(siteCode),
    { params },
  );
  return data.data;
}

export async function fetchDoctorAppointment(
  siteCode: SiteCode,
  appointmentId: string,
): Promise<DoctorAppointmentDto> {
  const { data } = await apiClient.get<ApiSuccess<DoctorAppointmentDto>>(
    endpoints.admin.doctorAppointment(siteCode, appointmentId),
  );
  return data.data;
}

export async function patchDoctorAppointmentStatus(
  siteCode: SiteCode,
  appointmentId: string,
  body: DoctorAppointmentStatusPatch,
): Promise<DoctorAppointmentDto> {
  const { data } = await apiClient.patch<ApiSuccess<DoctorAppointmentDto>>(
    endpoints.admin.doctorAppointment(siteCode, appointmentId),
    body,
  );
  return data.data;
}
