import { z } from 'zod';

const uuid = z.string().uuid();

export const shippingAddressSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100).optional(),
  postalCode: z.string().trim().min(4).max(20),
  country: z.string().trim().length(2).default('IN'),
  phone: z.string().trim().max(20).optional(),
});

export const createPaymentOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: uuid,
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1)
    .max(50),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  /** Required for guest checkout; ignored when authenticated. */
  guestSessionToken: z.string().min(32).max(256).optional(),
});

export const verifyPaymentBodySchema = z.object({
  orderId: uuid,
  razorpayOrderId: z.string().min(1).max(64),
  razorpayPaymentId: z.string().min(1).max(64),
  razorpaySignature: z.string().min(1).max(256),
  guestSessionToken: z.string().min(32).max(256).optional(),
});

export const paymentStatusParamsSchema = z.object({
  orderId: uuid,
});

export const paymentStatusQuerySchema = z.object({
  guestSessionToken: z.string().min(32).max(256).optional(),
});

export const orderConfirmationQuerySchema = z.object({
  orderId: uuid.optional(),
  confirmationToken: z.string().min(32).max(256).optional(),
});

export type CreatePaymentOrderBody = z.infer<typeof createPaymentOrderBodySchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentBodySchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
