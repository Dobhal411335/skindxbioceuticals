import {
  DoctorAppointmentsService,
  toDoctorAppointmentDto,
} from '../doctor-appointments.service';
import type { DoctorAppointmentsRepository } from '../doctor-appointments.repository';
import type { DoctorAppointmentRecord } from '../doctor-appointments.types';
import type { emailService } from '@/lib/email';
import { NotFoundError, ValidationError } from '@/utils/AppError';

function makeRecord(
  overrides: Partial<DoctorAppointmentRecord> = {},
): DoctorAppointmentRecord {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    siteId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    patientName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+91 9876543210',
    scheduledAt: new Date('2026-10-20T10:00:00.000Z'),
    problem: 'Persistent dryness on cheeks',
    status: 'NEW',
    createdAt: new Date('2026-10-14T08:00:00.000Z'),
    updatedAt: new Date('2026-10-14T08:00:00.000Z'),
    doctor: {
      name: 'Dr. Daisy Bins',
      specialization: 'Dermatology',
    },
    ...overrides,
  };
}

describe('DoctorAppointmentsService', () => {
  const create = jest.fn();
  const listBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const findActiveDoctorForSite = jest.fn();
  const updateStatusForSite = jest.fn();

  const repository = {
    create,
    listBySiteId,
    findByIdForSite,
    findActiveDoctorForSite,
    updateStatusForSite,
  } as unknown as DoctorAppointmentsRepository;

  const sendDoctorAppointmentRequestedEmail = jest.fn().mockResolvedValue({ submitted: true });
  const sendDoctorAppointmentConfirmedEmail = jest.fn().mockResolvedValue({ submitted: true });
  const sendDoctorAppointmentCancelledEmail = jest.fn().mockResolvedValue({ submitted: true });

  const mail = {
    sendDoctorAppointmentRequestedEmail,
    sendDoctorAppointmentConfirmedEmail,
    sendDoctorAppointmentCancelledEmail,
  } as unknown as typeof emailService;

  const service = new DoctorAppointmentsService(repository, mail);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps appointment records to DTOs with doctor metadata', () => {
    const record = makeRecord();
    expect(toDoctorAppointmentDto(record, 'IN')).toEqual({
      id: record.id,
      siteCode: 'IN',
      doctorId: record.doctorId,
      doctorName: 'Dr. Daisy Bins',
      doctorSpecialization: 'Dermatology',
      patientName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+91 9876543210',
      scheduledAt: '2026-10-20T10:00:00.000Z',
      problem: 'Persistent dryness on cheeks',
      status: 'NEW',
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-14T08:00:00.000Z',
    });
  });

  it('creates a public appointment for an active doctor', async () => {
    const record = makeRecord();
    findActiveDoctorForSite.mockResolvedValue({ id: record.doctorId, active: true });
    create.mockResolvedValue(record);

    const future = new Date(Date.now() + 86_400_000);
    const dto = await service.createPublic({
      siteId: record.siteId,
      siteCode: 'IN',
      body: {
        doctorId: record.doctorId,
        patientName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+91 9876543210',
        scheduledAt: future,
        problem: 'Persistent dryness on cheeks',
        website: '',
      },
    });

    expect(create).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        doctorId: record.doctorId,
        patientName: 'Jane Doe',
        email: 'jane@example.com',
      }),
    );
    expect(dto?.id).toBe(record.id);
  });

  it('rejects appointments for inactive or missing doctors', async () => {
    findActiveDoctorForSite.mockResolvedValue({ id: 'doc', active: false });

    await expect(
      service.createPublic({
        siteId: 'site',
        siteCode: 'IN',
        body: {
          doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          patientName: 'Jane',
          email: 'jane@example.com',
          phone: '+91 9876543210',
          scheduledAt: new Date(Date.now() + 86_400_000),
          problem: 'Issue',
          website: '',
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(create).not.toHaveBeenCalled();
  });

  it('silently accepts honeypot submissions without persisting', async () => {
    const result = await service.createPublic({
      siteId: 'site',
      siteCode: 'IN',
      body: {
        doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        patientName: 'Bot',
        email: 'bot@example.com',
        phone: '+91 9876543210',
        scheduledAt: new Date(Date.now() + 86_400_000),
        problem: 'Spam',
        website: 'http://spam.example',
      },
    });

    expect(result).toBeNull();
    expect(findActiveDoctorForSite).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('lists appointments with filters', async () => {
    const record = makeRecord();
    listBySiteId.mockResolvedValue([record]);
    const from = new Date('2026-10-01T00:00:00.000Z');
    const to = new Date('2026-10-31T23:59:59.000Z');

    const result = await service.listForSite(record.siteId, 'IN', {
      doctorId: record.doctorId,
      from,
      to,
    });

    expect(listBySiteId).toHaveBeenCalledWith(record.siteId, {
      doctorId: record.doctorId,
      from,
      to,
    });
    expect(result).toHaveLength(1);
  });

  it('throws NotFound when appointment is missing', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.getForSite('site', 'IN', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('patches appointment status for a site-scoped request', async () => {
    const record = makeRecord({ status: 'CANCELLED' });
    updateStatusForSite.mockResolvedValue(record);

    const dto = await service.patchForSite(record.siteId, 'IN', record.id, {
      status: 'CANCELLED',
    });

    expect(updateStatusForSite).toHaveBeenCalledWith(
      record.siteId,
      record.id,
      'CANCELLED',
    );
    expect(dto.status).toBe('CANCELLED');
  });

  it('throws NotFound when patching a missing appointment', async () => {
    updateStatusForSite.mockResolvedValue(null);

    await expect(
      service.patchForSite('site', 'IN', 'missing', { status: 'CONTACTED' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
