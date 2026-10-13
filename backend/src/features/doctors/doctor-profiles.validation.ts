import { z } from 'zod';
import {
  DOCTOR_CONSULTANCY_TYPES,
  normalizeDoctorName,
} from './doctors.constants';

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
  specialization: z.string().trim().min(1, 'Specialization is required').max(160),
  about: z.string().trim().min(1, 'About is required').max(2000),
  experienceYears: z.coerce.number().int().min(0).max(80),
  consultancyType: z.enum(DOCTOR_CONSULTANCY_TYPES),
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

  const consultancyRaw =
    typeof payload.consultancyType === 'string'
      ? payload.consultancyType.trim().toUpperCase().replace(/[\s-]+/g, '_')
      : payload.consultancyType;

  const consultancyType =
    consultancyRaw === 'BY_APPOINTMENT' || consultancyRaw === 'APPOINTMENT'
      ? 'BY_APPOINTMENT'
      : consultancyRaw === 'ONLINE'
        ? 'ONLINE'
        : payload.consultancyType;

  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    specialization:
      typeof payload.specialization === 'string'
        ? payload.specialization.trim()
        : payload.specialization,
    about: typeof payload.about === 'string' ? payload.about.trim() : payload.about,
    photoUrl,
    photoPublicId,
    consultancyType,
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
