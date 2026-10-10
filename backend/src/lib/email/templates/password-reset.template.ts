import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { EmailValidationError } from '../email.errors';
import { assertSafeActionUrl, validateSiteCode } from '../email.validation';
import type { PasswordResetEmailInput, RenderedEmail } from '../email.types';

export function renderPasswordResetEmail(
  input: Omit<PasswordResetEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const resetUrl = assertSafeActionUrl(input.resetUrl, siteCode);
  const expiresInMinutes = input.expiresInMinutes;

  if (!Number.isInteger(expiresInMinutes) || expiresInMinutes <= 0) {
    throw new EmailValidationError('expiresInMinutes must be a positive integer');
  }

  const contentHtml = [
    paragraphHtml('We received a request to reset your password.'),
    ctaButtonHtml('Reset password', resetUrl),
    linkFallbackHtml(resetUrl),
    paragraphHtml(`This single-use link expires in ${expiresInMinutes} minutes.`),
    mutedParagraphHtml(
      'If you did not request a password reset, you can ignore this email. Your password will remain unchanged.',
    ),
  ].join('');

  const contentText = [
    'We received a request to reset your password.',
    '',
    `Reset password: ${resetUrl}`,
    '',
    `This single-use link expires in ${expiresInMinutes} minutes.`,
    'If you did not request a password reset, you can ignore this email. Your password will remain unchanged.',
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Reset your password',
    contentHtml,
    contentText,
    preheader: 'Password reset instructions',
  });

  return {
    subject: `Reset your ${brand.siteName} password`,
    ...layout,
  };
}
