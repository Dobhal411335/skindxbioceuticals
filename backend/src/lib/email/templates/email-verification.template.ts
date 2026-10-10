import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { EmailValidationError } from '../email.errors';
import {
  assertSafeActionUrl,
  validateSiteCode,
} from '../email.validation';
import type { RenderedEmail, VerificationEmailInput } from '../email.types';

export function renderEmailVerificationEmail(
  input: Omit<VerificationEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const verificationUrl = assertSafeActionUrl(input.verificationUrl, siteCode);
  const expiresInMinutes = input.expiresInMinutes;

  if (!Number.isInteger(expiresInMinutes) || expiresInMinutes <= 0) {
    throw new EmailValidationError('expiresInMinutes must be a positive integer');
  }

  const contentHtml = [
    paragraphHtml('Please confirm your email address to finish setting up your account.'),
    ctaButtonHtml('Verify email', verificationUrl),
    linkFallbackHtml(verificationUrl),
    paragraphHtml(`This link expires in ${expiresInMinutes} minutes.`),
    mutedParagraphHtml(
      'If you did not create an account, you can ignore this email safely.',
    ),
  ].join('');

  const contentText = [
    'Please confirm your email address to finish setting up your account.',
    '',
    `Verify email: ${verificationUrl}`,
    '',
    `This link expires in ${expiresInMinutes} minutes.`,
    'If you did not create an account, you can ignore this email safely.',
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Verify your email',
    contentHtml,
    contentText,
    preheader: 'Confirm your email address',
  });

  return {
    subject: `Verify your ${brand.siteName} email`,
    ...layout,
  };
}
