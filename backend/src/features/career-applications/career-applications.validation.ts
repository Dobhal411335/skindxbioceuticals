import { z } from 'zod';

import { ValidationError } from '@/utils/AppError';
import {
  CAREER_APPLICATION_STATUSES,
  CAREER_HEARD_ABOUT,
  CAREER_POSITIONS,
  RESUME_MAX_BYTES,
  RESUME_MIME_TYPES,
} from './career-applications.constants';

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
      ctx.addIssue({ code: 'custom', message: 'Invalid date' });
      return z.NEVER;
    }
    return parsed;
  });

function intField(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} is required`)
    .transform((value) => Number(value))
    .refine((value) => value >= min && value <= max, `${label} is invalid`);
}

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export const careerApplicationCreateBodySchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(80),
    middleName: z.string().trim().max(80).optional().default(''),
    lastName: z.string().trim().min(1, 'Last name is required').max(80),
    birthMonth: intField('Birth month', 1, 12),
    birthDay: intField('Birth day', 1, 31),
    birthYear: intField('Birth year', 1940, new Date().getUTCFullYear()),
    streetAddress: z.string().trim().min(1, 'Street address is required').max(200),
    streetAddressLine2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(1, 'City is required').max(80),
    state: z.string().trim().min(1, 'State is required').max(80),
    postalCode: z.string().trim().min(4, 'Postal code is required').max(12),
    email: z.string().trim().email('Valid email is required').max(254),
    phone: z
      .string()
      .trim()
      .min(7, 'Phone number is required')
      .max(30)
      .refine((value) => {
        const digits = value.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 15;
      }, 'Enter a valid phone number'),
    linkedIn: z
      .string()
      .trim()
      .max(300)
      .optional()
      .default('')
      .refine(
        (value) => value === '' || /^https?:\/\/\S+$/i.test(value),
        'Enter a valid LinkedIn URL',
      ),
    positionApplied: z.enum(CAREER_POSITIONS),
    heardAbout: z.enum(CAREER_HEARD_ABOUT),
    availableStartDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Available start date is required')
      .transform((value, ctx) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
          ctx.addIssue({ code: 'custom', message: 'Available start date is invalid' });
          return z.NEVER;
        }
        if (parsed.getTime() < startOfTodayUtc()) {
          ctx.addIssue({
            code: 'custom',
            message: 'Available start date cannot be in the past',
          });
          return z.NEVER;
        }
        return parsed;
      }),
    companyWebsite: z.string().max(200).optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (!isRealDate(value.birthYear, value.birthMonth, value.birthDay)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Birth date is invalid',
        path: ['birthDay'],
      });
    }
    const birth = Date.UTC(value.birthYear, value.birthMonth - 1, value.birthDay);
    if (birth > startOfTodayUtc()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Birth date cannot be in the future',
        path: ['birthYear'],
      });
    }
  });

export const careerApplicationListQuerySchema = z
  .object({
    name: z.string().trim().max(160).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(40).optional(),
    position: z.enum(CAREER_POSITIONS).optional(),
    status: z.enum(CAREER_APPLICATION_STATUSES).optional(),
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

export const careerApplicationIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  applicationId: z.string().uuid(),
});

export const careerApplicationPatchBodySchema = z.object({
  status: z.enum(CAREER_APPLICATION_STATUSES),
});

export type CareerApplicationCreateBody = z.infer<typeof careerApplicationCreateBodySchema>;
export type CareerApplicationListQuery = z.infer<typeof careerApplicationListQuerySchema>;
export type CareerApplicationPatchBody = z.infer<typeof careerApplicationPatchBodySchema>;

const EXTENSION_BY_MIME: Record<(typeof RESUME_MIME_TYPES)[number], string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const MIME_BY_EXTENSION: Record<string, (typeof RESUME_MIME_TYPES)[number]> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function resumeExtension(file: Express.Multer.File): string {
  return file.originalname.split('.').pop()?.toLowerCase() || '';
}

export function assertResumeFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
  if (!file) {
    throw new ValidationError('Resume is required');
  }
  if (file.size > RESUME_MAX_BYTES) {
    throw new ValidationError('Resume must be 5 MB or smaller');
  }
  const extension = resumeExtension(file);
  const rawMime = file.mimetype.toLowerCase();
  const mime =
    rawMime === '' || rawMime === 'application/octet-stream'
      ? (MIME_BY_EXTENSION[extension] ?? rawMime)
      : rawMime;
  if (mime !== rawMime) {
    file.mimetype = mime;
  }
  const allowedMime = RESUME_MIME_TYPES.find((item) => item === mime);
  if (!allowedMime || EXTENSION_BY_MIME[allowedMime] !== extension) {
    throw new ValidationError('Resume must be a PDF, DOC, or DOCX file');
  }
}
