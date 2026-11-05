import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date' });
      return z.NEVER;
    }
    return parsed;
  });

export const doctorAppointmentCreateBodySchema = z.object({
  doctorId: z.string().uuid('Doctor is required'),
  patientName: z.string().trim().min(1, 'Name is required').max(160),
  email: z.string().trim().email('Valid email is required').max(254),
  phone: z.string().trim().min(5, 'Phone number is required').max(30),
  scheduledAt: z
    .string()
    .trim()
    .min(1, 'Date and time are required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Invalid date and time',
    })
    .transform((value) => new Date(value))
    .refine(
      (date) => {
        // Allow same-day appointments (from start of today with timezone buffer) or any future date
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return date.getTime() >= startOfToday.getTime() - 12 * 60 * 60 * 1000;
      },
      {
        message: 'Appointment date must be today or a future date',
      },
    ),
  problem: z.string().trim().min(1, 'Please describe your problem').max(2000),
  /** Optional previous medical history image (Cloudinary HTTPS URL from the public upload route). */
  medicalHistoryImageUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .transform((value) => value ?? '')
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      { message: 'Medical history image URL must be a valid URL' },
    ),
  medicalHistoryImagePublicId: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value ?? ''),
  /** Optional honeypot — non-empty values are accepted by the schema and dropped in the service. */
  website: z.string().max(200).optional(),
})
  .refine(
    (value) => {
      const hasUrl = value.medicalHistoryImageUrl.length > 0;
      const hasPublicId = value.medicalHistoryImagePublicId.length > 0;
      return hasUrl === hasPublicId;
    },
    {
      message: 'Medical history image URL and public ID must be provided together',
      path: ['medicalHistoryImageUrl'],
    },
  );

export const doctorAppointmentListQuerySchema = z
  .object({
    doctorId: z.string().uuid().optional(),
    from: optionalDateSchema,
    to: optionalDateSchema,
  })
  .refine(
    (value) => {
      if (value.from && value.to) {
        return value.from.getTime() <= value.to.getTime();
      }
      return true;
    },
    { message: '`from` must be before or equal to `to`' },
  );

export const doctorAppointmentIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  appointmentId: z.string().uuid(),
});

export const doctorAppointmentStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CLOSED',
  'CANCELLED',
]);

export const doctorAppointmentPatchBodySchema = z.object({
  status: doctorAppointmentStatusSchema,
});

export type DoctorAppointmentCreateBody = z.infer<typeof doctorAppointmentCreateBodySchema>;
export type DoctorAppointmentListQuery = z.infer<typeof doctorAppointmentListQuerySchema>;
export type DoctorAppointmentPatchBody = z.infer<typeof doctorAppointmentPatchBodySchema>;

export function normalizeDoctorAppointmentCreateInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const patientName =
    typeof payload.patientName === 'string'
      ? payload.patientName.trim()
      : typeof payload.name === 'string'
        ? payload.name.trim()
        : payload.patientName;

  const problem =
    typeof payload.problem === 'string'
      ? payload.problem.trim()
      : typeof payload.description === 'string'
        ? payload.description.trim()
        : payload.problem;

  const phone =
    typeof payload.phone === 'string'
      ? payload.phone.trim()
      : typeof payload.phoneNumber === 'string'
        ? payload.phoneNumber.trim()
        : payload.phone;

  const medicalHistoryImageUrl =
    typeof payload.medicalHistoryImageUrl === 'string'
      ? payload.medicalHistoryImageUrl.trim()
      : typeof payload.attachmentUrl === 'string'
        ? payload.attachmentUrl.trim()
        : payload.medicalHistoryImageUrl;

  const medicalHistoryImagePublicId =
    typeof payload.medicalHistoryImagePublicId === 'string'
      ? payload.medicalHistoryImagePublicId.trim()
      : typeof payload.attachmentPublicId === 'string'
        ? payload.attachmentPublicId.trim()
        : payload.medicalHistoryImagePublicId;

  return {
    ...payload,
    doctorId: typeof payload.doctorId === 'string' ? payload.doctorId.trim() : payload.doctorId,
    patientName,
    email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : payload.email,
    phone,
    scheduledAt:
      typeof payload.scheduledAt === 'string'
        ? payload.scheduledAt.trim()
        : payload.scheduledAt,
    problem,
    medicalHistoryImageUrl,
    medicalHistoryImagePublicId,
    website: typeof payload.website === 'string' ? payload.website : payload.website,
  };
}
