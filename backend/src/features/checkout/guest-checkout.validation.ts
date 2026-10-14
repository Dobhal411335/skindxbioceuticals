import { z } from 'zod';

export const guestSessionBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
});

export const guestSendOtpBodySchema = z.object({
  sessionToken: z.string().min(32).max(256),
});

export const guestVerifyOtpBodySchema = z.object({
  sessionToken: z.string().min(32).max(256),
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, 'OTP must be 4–8 digits'),
});

export type GuestSessionBody = z.infer<typeof guestSessionBodySchema>;
export type GuestSendOtpBody = z.infer<typeof guestSendOtpBodySchema>;
export type GuestVerifyOtpBody = z.infer<typeof guestVerifyOtpBodySchema>;
