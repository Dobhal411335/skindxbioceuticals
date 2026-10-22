import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // Optional: omit in production once an admin exists. When unset, /auth/bootstrap-admin stays disabled.
  ADMIN_BOOTSTRAP_SECRET: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z
      .string()
      .min(32, 'ADMIN_BOOTSTRAP_SECRET must be at least 32 characters')
      .optional(),
  ),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3002')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Brevo transactional email (server-only)
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),
  BREVO_SENDER_EMAIL: z.string().email('BREVO_SENDER_EMAIL must be a valid email'),
  BREVO_SENDER_NAME: z.string().min(1, 'BREVO_SENDER_NAME is required'),
  BREVO_REPLY_TO: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().email().optional(),
  ),

  // Company / site branding used in transactional emails
  COMPANY_NAME: z.string().min(1).default('SkinDx Bioc'),
  COMPANY_LOGO_URL: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().url().optional(),
  ),
  SUPPORT_EMAIL: z.string().email('SUPPORT_EMAIL must be a valid email'),
  COMPANY_PHONE: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().optional(),
  ),
  SITE_IN_URL: z.string().url('SITE_IN_URL must be a valid URL'),
  SITE_COM_URL: z.string().url('SITE_COM_URL must be a valid URL'),
  PRIVACY_POLICY_URL: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().url().optional(),
  ),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // Google OAuth (server-side ID token verification — never expose a client secret via NEXT_PUBLIC_)
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // Refresh-token cookie (customer Google / storefront session)
  AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default('skindx_refresh_token'),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    }),

  // Email verification OTP (customer password signup)
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),

  // Razorpay (server-only secrets — never expose KEY_SECRET / WEBHOOK_SECRET to the browser)
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  // Guest checkout session lifetime (hours)
  GUEST_CHECKOUT_SESSION_HOURS: z.coerce.number().int().positive().default(24),
  GUEST_CONFIRMATION_TOKEN_MINUTES: z.coerce.number().int().positive().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
