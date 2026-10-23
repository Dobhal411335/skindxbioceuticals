import { z } from 'zod';

export const siteCodeSchema = z
  .enum(['IN', 'COM', 'in', 'com'])
  .transform((value) => value.toUpperCase() as 'IN' | 'COM');

export const newsletterSubscribeBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255)
    .transform((val) => val.toLowerCase()),
});

export const newsletterUnsubscribeQuerySchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
});

export const sendPromotionalEmailBodySchema = z.object({
  recipients: z
    .array(z.string().trim().email('Invalid recipient email address'))
    .min(1, 'At least one recipient must be selected'),
  subject: z
    .string()
    .trim()
    .min(1, 'Email subject is required')
    .max(300, 'Subject is too long'),
  messageHtml: z
    .string()
    .trim()
    .min(1, 'Email message cannot be empty'),
});

export const siteCodeParamSchema = z.object({
  siteCode: siteCodeSchema,
});

export const optionalSiteCodeParamSchema = z.object({
  siteCode: z
    .enum(['IN', 'COM', 'in', 'com'])
    .optional()
    .default('IN')
    .transform((value) => (value ? (value.toUpperCase() as 'IN' | 'COM') : 'IN')),
});
