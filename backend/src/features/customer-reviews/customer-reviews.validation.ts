import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'Customer image URL is required')
  .max(2000)
  .url('Customer image URL must be a valid absolute URL')
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'Customer image URL must use http or https',
  });

export const customerReviewBodySchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(120),
  designation: z.string().trim().min(1, 'Designation is required').max(160),
  description: z.string().trim().min(1, 'Review description is required').max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  imageUrl: imageUrlSchema,
  imagePublicId: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const customerReviewPatchSchema = z
  .object({
    active: z.boolean().optional(),
    order: z.coerce.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => value.active !== undefined || value.order !== undefined, {
    message: 'At least one of active or order is required',
  });

export const customerReviewIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  reviewId: z.string().uuid(),
});

export type CustomerReviewBody = z.infer<typeof customerReviewBodySchema>;
export type CustomerReviewPatchBody = z.infer<typeof customerReviewPatchSchema>;

export function normalizeCustomerReviewInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;
  const image =
    payload.image && typeof payload.image === 'object'
      ? (payload.image as Record<string, unknown>)
      : null;

  const imageUrl =
    typeof payload.imageUrl === 'string'
      ? payload.imageUrl.trim()
      : typeof payload.customerImageUrl === 'string'
        ? payload.customerImageUrl.trim()
        : typeof payload.url === 'string'
          ? payload.url.trim()
          : typeof image?.url === 'string'
            ? image.url.trim()
            : typeof image?.secureUrl === 'string'
              ? image.secureUrl.trim()
              : payload.imageUrl;

  const imagePublicId =
    typeof payload.imagePublicId === 'string'
      ? payload.imagePublicId.trim()
      : typeof payload.publicId === 'string'
        ? payload.publicId.trim()
        : typeof image?.publicId === 'string'
          ? image.publicId.trim()
          : typeof image?.key === 'string'
            ? image.key.trim()
            : (payload.imagePublicId ?? '');

  const customerName =
    typeof payload.customerName === 'string'
      ? payload.customerName.trim()
      : typeof payload.name === 'string'
        ? payload.name.trim()
        : payload.customerName;

  const description =
    typeof payload.description === 'string'
      ? payload.description.trim()
      : typeof payload.body === 'string'
        ? payload.body.trim()
        : typeof payload.quote === 'string'
          ? payload.quote.trim()
          : payload.description;

  return {
    ...payload,
    customerName,
    designation:
      typeof payload.designation === 'string' ? payload.designation.trim() : payload.designation,
    description,
    imageUrl,
    imagePublicId,
    active: payload.active ?? true,
    order:
      payload.order === '' || payload.order === undefined || payload.order === null
        ? undefined
        : Number(payload.order),
  };
}
