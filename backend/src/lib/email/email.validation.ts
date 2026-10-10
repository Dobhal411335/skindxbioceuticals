import { z } from 'zod';
import type { SiteCode } from '@/types/common';
import { EmailValidationError } from './email.errors';
import { getEmailBrand } from './company/company.config';

const emailRecipientSchema = z.object({
  email: z.string().email('Recipient email is invalid'),
  name: z.string().trim().min(1).max(200).optional(),
});

const siteCodeSchema = z.enum(['IN', 'COM']);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripControlChars(value: string): string {
  // Prevent header injection via CR/LF in subjects/names
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

/**
 * Ensures action/redirect URLs are absolute http(s) and belong to the site origin
 * (or an explicitly allowed tracking host when provided).
 */
export function assertHttpUrl(url: string, field = 'URL'): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new EmailValidationError(`${field} is invalid`);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new EmailValidationError(`${field} must use http or https`);
  }

  return parsed.toString();
}

/**
 * Ensures action/redirect URLs are absolute http(s) and belong to the site origin
 * (or an explicitly allowed external origin when provided by a trusted integration).
 */
export function assertSafeActionUrl(
  url: string,
  siteCode: SiteCode,
  options?: { allowExternalOrigins?: string[] },
): string {
  const parsedString = assertHttpUrl(url, 'Action URL');
  const parsed = new URL(parsedString);

  const brand = getEmailBrand(siteCode);
  const allowedOrigins = new Set<string>([new URL(brand.siteUrl).origin]);

  for (const origin of options?.allowExternalOrigins ?? []) {
    try {
      allowedOrigins.add(new URL(origin).origin);
    } catch {
      // ignore malformed allow-list entries
    }
  }

  if (!allowedOrigins.has(parsed.origin)) {
    throw new EmailValidationError('Action URL is not allowed for this site');
  }

  return parsed.toString();
}

export function validateRecipient(input: unknown): { email: string; name?: string } {
  const parsed = emailRecipientSchema.safeParse(input);
  if (!parsed.success) {
    throw new EmailValidationError('Invalid email recipient', parsed.error.flatten());
  }
  return {
    email: parsed.data.email.toLowerCase(),
    name: parsed.data.name ? stripControlChars(parsed.data.name) : undefined,
  };
}

export function validateSiteCode(siteCode: unknown): SiteCode {
  const parsed = siteCodeSchema.safeParse(siteCode);
  if (!parsed.success) {
    throw new EmailValidationError('Invalid site code');
  }
  return parsed.data;
}

export function requireNonEmptyString(value: unknown, field: string, max = 2000): string {
  const parsed = z.string().trim().min(1).max(max).safeParse(value);
  if (!parsed.success) {
    throw new EmailValidationError(`${field} is required`);
  }
  return stripControlChars(parsed.data);
}
