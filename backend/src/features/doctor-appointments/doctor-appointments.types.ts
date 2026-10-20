import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type DoctorAppointmentStatusValue =
  | 'NEW'
  | 'CONTACTED'
  | 'CLOSED'
  | 'CANCELLED';

export const DOCTOR_APPOINTMENT_STATUSES = [
  'NEW',
  'CONTACTED',
  'CLOSED',
  'CANCELLED',
] as const satisfies readonly DoctorAppointmentStatusValue[];

export type DoctorAppointmentDto = {
  id: string;
  siteCode: SiteCodeDto;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  email: string;
  phone: string;
  scheduledAt: string;
  problem: string;
  status: DoctorAppointmentStatusValue;
  createdAt: string;
  updatedAt: string;
};

export type DoctorAppointmentRecord = {
  id: string;
  siteId: string;
  doctorId: string;
  patientName: string;
  email: string;
  phone: string;
  scheduledAt: Date;
  problem: string;
  status: DoctorAppointmentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  doctor: {
    name: string;
    specialization: string;
  };
};

export type DoctorAppointmentWrite = {
  doctorId: string;
  patientName: string;
  email: string;
  phone: string;
  scheduledAt: Date;
  problem: string;
};

export type DoctorAppointmentListFilters = {
  doctorId?: string;
  from?: Date;
  to?: Date;
};
