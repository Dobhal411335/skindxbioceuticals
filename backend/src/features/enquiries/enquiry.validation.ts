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

export const enquiryCreateBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  email: z.string().trim().email('Valid email is required').max(254),
  phone: z.string().trim().min(5, 'Phone number is required').max(40),
  message: z.string().trim().min(1, 'Description is required').max(4000),
  subject: z.string().trim().max(200).optional(),
  /** Optional honeypot — non-empty values are accepted by the schema and dropped in the service. */
  website: z.string().max(200).optional(),
});

export const enquiryListQuerySchema = z
  .object({
    name: z.string().trim().max(160).optional(),
    email: z.string().trim().max(254).optional(),
    phone: z.string().trim().max(40).optional(),
    from: optionalDateSchema,
    to: optionalDateSchema,
    status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
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

export const enquiryIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  enquiryId: z.string().uuid(),
});

export const enquiryStatusSchema = z.enum([
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

export const enquiryPatchBodySchema = z.object({
  status: enquiryStatusSchema,
});

export type EnquiryCreateBody = z.infer<typeof enquiryCreateBodySchema>;
export type EnquiryListQuery = z.infer<typeof enquiryListQuerySchema>;
export type EnquiryPatchBody = z.infer<typeof enquiryPatchBodySchema>;

export function normalizeEnquiryCreateInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const message =
    typeof payload.message === 'string'
      ? payload.message.trim()
      : typeof payload.description === 'string'
        ? payload.description.trim()
        : payload.message;

  const phone =
    typeof payload.phone === 'string'
      ? payload.phone.trim()
      : typeof payload.phoneNumber === 'string'
        ? payload.phoneNumber.trim()
        : payload.phone;

  return {
    ...payload,
    name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
    email:
      typeof payload.email === 'string'
        ? payload.email.trim().toLowerCase()
        : payload.email,
    phone,
    message,
    subject:
      typeof payload.subject === 'string' ? payload.subject.trim() : payload.subject,
    website: typeof payload.website === 'string' ? payload.website : payload.website,
  };
}
