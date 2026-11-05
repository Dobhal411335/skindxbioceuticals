import { prisma } from '@/lib/prisma';
import type {
  DoctorAppointmentListFilters,
  DoctorAppointmentRecord,
  DoctorAppointmentStatusValue,
  DoctorAppointmentWrite,
} from './doctor-appointments.types';

const doctorSelect = {
  name: true,
  specializations: true,
} as const;

type AppointmentRow = Omit<DoctorAppointmentRecord, 'doctor'> & {
  doctor: { name: string; specializations: string[] };
};

function mapRow(row: AppointmentRow): DoctorAppointmentRecord {
  return {
    ...row,
    doctor: {
      name: row.doctor.name,
      specialization: row.doctor.specializations.filter(Boolean).join(', '),
    },
  };
}

export class DoctorAppointmentsRepository {
  async create(siteId: string, data: DoctorAppointmentWrite): Promise<DoctorAppointmentRecord> {
    const row = await prisma.doctorAppointment.create({
      data: {
        siteId,
        doctorId: data.doctorId,
        patientName: data.patientName,
        email: data.email,
        phone: data.phone,
        scheduledAt: data.scheduledAt,
        problem: data.problem,
        medicalHistoryImageUrl: data.medicalHistoryImageUrl,
        medicalHistoryImagePublicId: data.medicalHistoryImagePublicId,
      },
      include: { doctor: { select: doctorSelect } },
    });
    return mapRow(row);
  }

  async listBySiteId(
    siteId: string,
    filters: DoctorAppointmentListFilters = {},
  ): Promise<DoctorAppointmentRecord[]> {
    const scheduledAt =
      filters.from || filters.to
        ? {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          }
        : undefined;

    const rows = await prisma.doctorAppointment.findMany({
      where: {
        siteId,
        ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      },
      include: { doctor: { select: doctorSelect } },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async findByIdForSite(
    siteId: string,
    appointmentId: string,
  ): Promise<DoctorAppointmentRecord | null> {
    const row = await prisma.doctorAppointment.findFirst({
      where: { id: appointmentId, siteId },
      include: { doctor: { select: doctorSelect } },
    });
    return row ? mapRow(row) : null;
  }

  async findActiveDoctorForSite(
    siteId: string,
    doctorId: string,
  ): Promise<{ id: string; active: boolean } | null> {
    return prisma.doctorProfile.findFirst({
      where: { id: doctorId, siteId },
      select: { id: true, active: true },
    });
  }

  async updateStatusForSite(
    siteId: string,
    appointmentId: string,
    status: DoctorAppointmentStatusValue,
  ): Promise<DoctorAppointmentRecord | null> {
    const existing = await prisma.doctorAppointment.findFirst({
      where: { id: appointmentId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.doctorAppointment.update({
      where: { id: appointmentId },
      data: { status },
      include: { doctor: { select: doctorSelect } },
    });
    return mapRow(row);
  }
}

export const doctorAppointmentsRepository = new DoctorAppointmentsRepository();
