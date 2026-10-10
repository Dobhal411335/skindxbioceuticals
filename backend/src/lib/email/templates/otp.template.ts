import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { emailStyles } from '../layouts/email-styles';
import { EmailValidationError } from '../email.errors';
import {
  escapeHtml,
  requireNonEmptyString,
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { OtpEmailInput, RenderedEmail } from '../email.types';

export function renderOtpEmail(
  input: Omit<OtpEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const otpCode = requireNonEmptyString(input.otpCode, 'otpCode', 32);
  const purpose = requireNonEmptyString(input.purpose, 'purpose', 200);
  const expiresInMinutes = input.expiresInMinutes;
  const displayName = input.displayName
    ? stripControlChars(input.displayName)
    : undefined;

  if (!Number.isInteger(expiresInMinutes) || expiresInMinutes <= 0) {
    throw new EmailValidationError('expiresInMinutes must be a positive integer');
  }

  const greeting = displayName ? `Hi ${displayName},` : 'Hi,';

  const contentHtml = [
    paragraphHtml(greeting),
    paragraphHtml(`Use the verification code below for: ${purpose}.`),
    `<p style="${emailStyles.paragraph}"><span style="${emailStyles.codeBox}">${escapeHtml(otpCode)}</span></p>`,
    paragraphHtml(`This code expires in ${expiresInMinutes} minutes.`),
    mutedParagraphHtml('Do not share this code with anyone. Our team will never ask for it.'),
  ].join('');

  const contentText = [
    greeting,
    '',
    `Use the verification code below for: ${purpose}.`,
    '',
    `Code: ${otpCode}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    'Do not share this code with anyone. Our team will never ask for it.',
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Your verification code',
    contentHtml,
    contentText,
    preheader: `Your ${brand.siteName} verification code`,
  });

  return {
    subject: `${brand.siteName} verification code`,
    ...layout,
  };
}
