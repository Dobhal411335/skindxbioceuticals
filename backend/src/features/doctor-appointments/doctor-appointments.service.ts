import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { doctorAppointmentsRepository } from './doctor-appointments.repository';
import type {
  DoctorAppointmentCreateBody,
  DoctorAppointmentListQuery,
  DoctorAppointmentPatchBody,
} from './doctor-appointments.validation';
import type {
  DoctorAppointmentDto,
  DoctorAppointmentRecord,
  SiteCodeDto,
} from './doctor-appointments.types';

export function toDoctorAppointmentDto(
  record: DoctorAppointmentRecord,
  siteCode: SiteCodeDto,
): DoctorAppointmentDto {
  return {
    id: record.id,
    siteCode,
    doctorId: record.doctorId,
    doctorName: record.doctor.name,
    doctorSpecialization: record.doctor.specialization,
    patientName: record.patientName,
    email: record.email,
    scheduledAt: record.scheduledAt.toISOString(),
    problem: record.problem,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DoctorAppointmentsService {
  constructor(private readonly repository = doctorAppointmentsRepository) {}

  async createPublic(input: {
    siteId: string;
    siteCode: SiteCode;
    body: DoctorAppointmentCreateBody;
  }): Promise<DoctorAppointmentDto | null> {
    // Honeypot filled → pretend success without persisting.
    if ((input.body.website ?? '').trim().length > 0) {
      logger.info(
        {
          event: 'doctor_appointment.honeypot_rejected',
          siteCode: input.siteCode,
        },
        'Doctor appointment honeypot triggered',
      );
      return null;
    }

    const doctor = await this.repository.findActiveDoctorForSite(
      input.siteId,
      input.body.doctorId,
    );
    if (!doctor || !doctor.active) {
      throw new ValidationError('Selected doctor is not available');
    }

    const record = await this.repository.create(input.siteId, {
      doctorId: input.body.doctorId,
      patientName: input.body.patientName,
      email: input.body.email,
      scheduledAt: input.body.scheduledAt,
      problem: input.body.problem,
    });

    logger.info(
      {
        event: 'doctor_appointment.created',
        siteCode: input.siteCode,
        appointmentId: record.id,
        doctorId: record.doctorId,
        scheduledAt: record.scheduledAt.toISOString(),
      },
      'Doctor appointment request created',
    );

    return toDoctorAppointmentDto(record, input.siteCode);
  }

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    query: DoctorAppointmentListQuery,
  ): Promise<DoctorAppointmentDto[]> {
    const rows = await this.repository.listBySiteId(siteId, {
      doctorId: query.doctorId,
      from: query.from,
      to: query.to,
    });
    return rows.map((row) => toDoctorAppointmentDto(row, siteCode));
  }

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    appointmentId: string,
  ): Promise<DoctorAppointmentDto> {
    const record = await this.repository.findByIdForSite(siteId, appointmentId);
    if (!record) {
      throw new NotFoundError('Appointment request not found');
    }
    return toDoctorAppointmentDto(record, siteCode);
  }

  async patchForSite(
    siteId: string,
    siteCode: SiteCode,
    appointmentId: string,
    body: DoctorAppointmentPatchBody,
  ): Promise<DoctorAppointmentDto> {
    const record = await this.repository.updateStatusForSite(
      siteId,
      appointmentId,
      body.status,
    );
    if (!record) {
      throw new NotFoundError('Appointment request not found');
    }

    logger.info(
      {
        event: 'doctor_appointment.status_updated',
        siteCode,
        appointmentId: record.id,
        status: record.status,
      },
      'Doctor appointment status updated',
    );

    return toDoctorAppointmentDto(record, siteCode);
  }
}

export const doctorAppointmentsService = new DoctorAppointmentsService();
