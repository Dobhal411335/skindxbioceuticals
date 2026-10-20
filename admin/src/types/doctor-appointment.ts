export const DOCTOR_APPOINTMENT_STATUSES = [
  "NEW",
  "CONTACTED",
  "CLOSED",
  "CANCELLED",
] as const;

export type DoctorAppointmentStatus =
  (typeof DOCTOR_APPOINTMENT_STATUSES)[number];

export type DoctorAppointmentDto = {
  id: string;
  siteCode: "IN" | "COM";
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  email: string;
  phone: string;
  scheduledAt: string;
  problem: string;
  status: DoctorAppointmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type DoctorAppointmentListParams = {
  doctorId?: string;
  from?: string;
  to?: string;
};

export type DoctorAppointmentStatusPatch = {
  status: DoctorAppointmentStatus;
};
