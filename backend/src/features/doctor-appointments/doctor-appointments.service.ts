import { logger } from '@/lib/logger';
import { emailService } from '@/lib/email';
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
    phone: record.phone,
    scheduledAt: record.scheduledAt.toISOString(),
    problem: record.problem,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class DoctorAppointmentsService {
  constructor(
    private readonly repository = doctorAppointmentsRepository,
    private readonly mail = emailService,
  ) {}

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
      phone: input.body.phone,
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

    // Send acknowledgement email to patient with booking details
    void this.mail
      .sendDoctorAppointmentRequestedEmail({
        to: { email: record.email, name: record.patientName },
        siteCode: input.siteCode,
        patientName: record.patientName,
        email: record.email,
        phone: record.phone,
        doctorName: record.doctor.name,
        doctorSpecialization: record.doctor.specialization,
        scheduledAt: record.scheduledAt,
        problem: record.problem,
      })
      .catch((err) => {
        logger.error(
          { err, appointmentId: record.id },
          'Failed to send doctor appointment requested email',
        );
      });

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

    // Send status transition emails
    if (body.status === 'CONTACTED') {
      void this.mail
        .sendDoctorAppointmentConfirmedEmail({
          to: { email: record.email, name: record.patientName },
          siteCode,
          patientName: record.patientName,
          doctorName: record.doctor.name,
          doctorSpecialization: record.doctor.specialization,
          scheduledAt: record.scheduledAt,
        })
        .catch((err) => {
          logger.error(
            { err, appointmentId: record.id },
            'Failed to send doctor appointment confirmed email',
          );
        });
    } else if (body.status === 'CANCELLED') {
      void this.mail
        .sendDoctorAppointmentCancelledEmail({
          to: { email: record.email, name: record.patientName },
          siteCode,
          patientName: record.patientName,
          doctorName: record.doctor.name,
          scheduledAt: record.scheduledAt,
        })
        .catch((err) => {
          logger.error(
            { err, appointmentId: record.id },
            'Failed to send doctor appointment cancelled email',
          );
        });
    }

    return toDoctorAppointmentDto(record, siteCode);
  }
}

export const doctorAppointmentsService = new DoctorAppointmentsService();
