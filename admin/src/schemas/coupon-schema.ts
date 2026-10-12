import { z } from "zod";

import type { CouponFormValues, CouponPayload } from "@/types/coupon";

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Coupon code is required")
      .max(64, "Coupon code must be at most 64 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Coupon code may only contain letters, numbers, hyphens, and underscores",
      ),
    amount: z.string().trim(),
    percent: z.string().trim(),
    startsAt: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required"),
    endsAt: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date is required"),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const hasAmount = value.amount !== "";
    const hasPercent = value.percent !== "";

    if (hasAmount === hasPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fill either amount or percent, not both",
        path: hasAmount ? ["percent"] : ["amount"],
      });
    }

    if (hasAmount) {
      const amount = Number(value.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Amount must be greater than 0",
          path: ["amount"],
        });
      }
    }

    if (hasPercent) {
      const percent = Number(value.percent);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percent must be greater than 0 and at most 100",
          path: ["percent"],
        });
      }
    }

    if (value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["endsAt"],
      });
    }
  });

export type CouponFormErrors = Partial<
  Record<"code" | "amount" | "percent" | "startsAt" | "endsAt" | "isActive", string>
>;

export function validateCouponForm(
  values: CouponFormValues,
):
  | { success: true; data: CouponFormValues }
  | { success: false; errors: CouponFormErrors } {
  const result = couponFormSchema.safeParse(values);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const formErrors = result.error.flatten().formErrors;
    return {
      success: false,
      errors: {
        code: fieldErrors.code?.[0],
        amount: fieldErrors.amount?.[0] ?? formErrors[0],
        percent: fieldErrors.percent?.[0],
        startsAt: fieldErrors.startsAt?.[0],
        endsAt: fieldErrors.endsAt?.[0],
        isActive: fieldErrors.isActive?.[0],
      },
    };
  }
  return { success: true, data: result.data };
}

export function toCouponPayload(values: CouponFormValues): CouponPayload {
  const hasAmount = values.amount.trim() !== "";
  return {
    code: values.code.trim().toUpperCase(),
    amount: hasAmount ? Number(values.amount) : null,
    percent: hasAmount ? null : Number(values.percent),
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    isActive: values.isActive,
  };
}
