import { z } from 'zod';
import { INDIA_STATES } from '@/lib/india-states';
import { normalizeDoctorName } from './doctors.constants';

const optionalText = (max: number) => z.string().trim().max(max).default('');

function normalizeDoctorPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const local =
    digits.length > 10 && digits.startsWith('91') ? digits.slice(2) : digits;
  return `+91 ${local}`;
}

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const photoUrlSchema = z
  .string()
  .trim()
  .min(1, 'Doctor photo URL is required')
  .max(2000)
  .url('Doctor photo URL must be a valid absolute URL')
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'Doctor photo URL must use http or https',
  });

export const doctorProfileBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Doctor name is required')
    .max(160)
    .transform(normalizeDoctorName),
  specializations: z
    .array(z.string().trim().min(1).max(160))
    .min(1, 'At least one specialization is required')
    .max(12, 'Add at most 12 specializations')
    .transform((items) => {
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const item of items) {
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
      }
      return unique;
    }),
  about: z.string().trim().min(1, 'About is required').max(2000),
  experienceYears: z.coerce.number().int().min(0).max(80),
  state: z.enum(INDIA_STATES, { message: 'Select a valid Indian state' }),
  city: z.string().trim().min(1, 'City is required').max(120),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(30)
    .transform(normalizeDoctorPhone)
    .refine((value) => /^\+91 [6-9]\d{9}$/.test(value), {
      message: 'Enter a valid 10-digit Indian mobile number',
    }),
  email: z.string().trim().email('Enter a valid email').max(254).transform((value) => value.toLowerCase()),
  location: z.string().trim().min(1, 'Location is required').max(2000),
  education: optionalText(4000),
  degree: optionalText(4000),
  workHistory: optionalText(4000),
  workDays: optionalText(4000),
  photoUrl: photoUrlSchema,
  photoPublicId: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const doctorProfilePatchSchema = z
  .object({
    active: z.boolean().optional(),
    order: z.coerce.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => value.active !== undefined || value.order !== undefined, {
    message: 'At least one of active or order is required',
  });

export const doctorProfileIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  doctorId: z.string().uuid(),
});

export type DoctorProfileBody = z.infer<typeof doctorProfileBodySchema>;
export type DoctorProfilePatchBody = z.infer<typeof doctorProfilePatchSchema>;

export function normalizeDoctorProfileInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const photo =
    payload.photo && typeof payload.photo === 'object'
      ? (payload.photo as Record<string, unknown>)
      : payload.image && typeof payload.image === 'object'
        ? (payload.image as Record<string, unknown>)
        : null;

  const photoUrl =
    typeof payload.photoUrl === 'string'
      ? payload.photoUrl.trim()
      : typeof payload.imageUrl === 'string'
        ? payload.imageUrl.trim()
        : typeof photo?.secureUrl === 'string'
          ? photo.secureUrl.trim()
          : typeof photo?.url === 'string'
            ? photo.url.trim()
            : payload.photoUrl;

  const photoPublicId =
    typeof payload.photoPublicId === 'string'
      ? payload.photoPublicId.trim()
      : typeof payload.imagePublicId === 'string'
        ? payload.imagePublicId.trim()
        : typeof payload.publicId === 'string'
          ? payload.publicId.trim()
          : typeof photo?.publicId === 'string'
            ? photo.publicId.trim()
            : (payload.photoPublicId ?? '');

  const specializations = Array.isArray(payload.specializations)
    ? payload.specializations
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : typeof payload.specialization === 'string' && payload.specialization.trim()
      ? [payload.specialization.trim()]
      : payload.specializations;

  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : value);

  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    specializations,
    about: text(payload.about),
    state: text(payload.state),
    city: text(payload.city),
    phone: text(payload.phone),
    email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : payload.email,
    location: text(payload.location),
    education: text(payload.education),
    degree: text(payload.degree),
    workHistory: text(payload.workHistory),
    workDays: text(payload.workDays),
    photoUrl,
    photoPublicId,
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
    experienceYears:
      payload.experienceYears === '' ||
      payload.experienceYears === undefined ||
      payload.experienceYears === null
        ? payload.experienceYears
        : Number(payload.experienceYears),
  };
}
