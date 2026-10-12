import { z } from 'zod';

const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const optionalNumberField = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return value;
}, z.coerce.number().finite().nullable());

export const couponBodySchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Coupon code is required')
      .max(64, 'Coupon code must be at most 64 characters')
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z0-9_-]+$/.test(value), {
        message: 'Coupon code may only contain letters, numbers, hyphens, and underscores',
      }),
    amount: optionalNumberField,
    percent: optionalNumberField,
    startsAt: dateOnlySchema,
    endsAt: dateOnlySchema,
    isActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    const hasAmount = value.amount !== null && value.amount !== undefined;
    const hasPercent = value.percent !== null && value.percent !== undefined;

    if (hasAmount === hasPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either amount or percent, not both',
        path: hasAmount ? ['percent'] : ['amount'],
      });
    }

    if (hasAmount && (value.amount as number) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount must be greater than 0',
        path: ['amount'],
      });
    }

    if (hasPercent) {
      const percent = value.percent as number;
      if (percent <= 0 || percent > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percent must be greater than 0 and at most 100',
          path: ['percent'],
        });
      }
    }

    if (value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['endsAt'],
      });
    }
  });

export const couponPatchSchema = z.object({
  isActive: z.boolean(),
});

export const couponIdParamSchema = z.object({
  siteCode: siteCodeSchema,
  couponId: z.string().uuid(),
});

export type CouponBody = z.infer<typeof couponBodySchema>;
export type CouponPatchBody = z.infer<typeof couponPatchSchema>;

export function normalizeCouponInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const payload = raw as Record<string, unknown>;

  const emptyToNull = (value: unknown) =>
    value === '' || value === undefined ? null : value;

  return {
    ...payload,
    code: typeof payload.code === 'string' ? payload.code.trim() : payload.code,
    amount: emptyToNull(payload.amount),
    percent: emptyToNull(payload.percent),
    startsAt:
      typeof payload.startsAt === 'string'
        ? payload.startsAt.trim().slice(0, 10)
        : payload.startsAt,
    endsAt:
      typeof payload.endsAt === 'string'
        ? payload.endsAt.trim().slice(0, 10)
        : payload.endsAt,
    isActive: payload.isActive ?? true,
  };
}

export function parseDateOnlyStart(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export function parseDateOnlyEnd(dateOnly: string): Date {
  return new Date(`${dateOnly}T23:59:59.999Z`);
}

export function toDateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}
