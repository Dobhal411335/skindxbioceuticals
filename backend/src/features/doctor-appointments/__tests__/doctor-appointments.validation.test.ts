import {
  doctorAppointmentCreateBodySchema,
  doctorAppointmentListQuerySchema,
  doctorAppointmentPatchBodySchema,
  normalizeDoctorAppointmentCreateInput,
} from '../doctor-appointments.validation';

describe('doctor-appointments validation', () => {
  const futureIso = new Date(Date.now() + 86_400_000).toISOString();

  it('accepts a valid create payload', () => {
    const result = doctorAppointmentCreateBodySchema.safeParse({
      doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      patientName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+91 9876543210',
      scheduledAt: futureIso,
      problem: 'Skin concern',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scheduledAt).toBeInstanceOf(Date);
      expect(result.data.patientName).toBe('Jane Doe');
      expect(result.data.phone).toBe('+91 9876543210');
    }
  });

  it('rejects past appointment times', () => {
    const result = doctorAppointmentCreateBodySchema.safeParse({
      doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      patientName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+91 9876543210',
      scheduledAt: '2020-01-01T10:00:00.000Z',
      problem: 'Skin concern',
    });

    expect(result.success).toBe(false);
  });

  it('allows honeypot website field for service-layer handling', () => {
    const result = doctorAppointmentCreateBodySchema.safeParse({
      doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      patientName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+91 9876543210',
      scheduledAt: futureIso,
      problem: 'Skin concern',
      website: 'http://spam',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe('http://spam');
    }
  });

  it('normalizes name/description aliases and lowercases email', () => {
    const normalized = normalizeDoctorAppointmentCreateInput({
      doctorId: ' cccccccc-cccc-cccc-cccc-cccccccccccc ',
      name: ' Jane ',
      email: 'Jane@Example.COM',
      phoneNumber: ' +91 9876543210 ',
      scheduledAt: futureIso,
      description: ' Dryness ',
    }) as Record<string, unknown>;

    expect(normalized.patientName).toBe('Jane');
    expect(normalized.email).toBe('jane@example.com');
    expect(normalized.phone).toBe('+91 9876543210');
    expect(normalized.problem).toBe('Dryness');
    expect(normalized.doctorId).toBe('cccccccc-cccc-cccc-cccc-cccccccccccc');
  });

  it('parses list query date filters', () => {
    const result = doctorAppointmentListQuerySchema.safeParse({
      doctorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-31T23:59:59.000Z',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeInstanceOf(Date);
      expect(result.data.to).toBeInstanceOf(Date);
    }
  });

  it('rejects from after to', () => {
    const result = doctorAppointmentListQuerySchema.safeParse({
      from: '2026-10-31T00:00:00.000Z',
      to: '2026-10-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid status patch values', () => {
    for (const status of ['NEW', 'CONTACTED', 'CLOSED', 'CANCELLED'] as const) {
      const result = doctorAppointmentPatchBodySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status patch values', () => {
    const result = doctorAppointmentPatchBodySchema.safeParse({
      status: 'PENDING',
    });
    expect(result.success).toBe(false);
  });
});
