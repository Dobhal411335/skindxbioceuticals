import { z } from 'zod';

/**
 * Zod schemas for the auth feature.
 * Ready for customer and admin authentication endpoints.
 */

export const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

/** Admin bootstrap / staff passwords — length only, no complexity rules. */
export const adminPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128);

export const authIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, 'OTP must be a numeric code'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const bootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: adminPasswordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  bootstrapSecret: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).optional(),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AuthIdParam = z.infer<typeof authIdParamSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
