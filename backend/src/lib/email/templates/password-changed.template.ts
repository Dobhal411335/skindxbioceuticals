import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { stripControlChars, validateSiteCode } from '../email.validation';
import type { PasswordChangedEmailInput, RenderedEmail } from '../email.types';

export function renderPasswordChangedEmail(
  input: Omit<PasswordChangedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const displayName = input.displayName
    ? stripControlChars(input.displayName)
    : undefined;

  const greeting = displayName ? `Hi ${displayName},` : 'Hi,';

  const contentHtml = [
    paragraphHtml(greeting),
    paragraphHtml('Your password was changed successfully.'),
    mutedParagraphHtml(
      `If you did not make this change, contact support immediately at ${brand.supportEmail}.`,
    ),
  ].join('');

  const contentText = [
    greeting,
    '',
    'Your password was changed successfully.',
    '',
    `If you did not make this change, contact support immediately at ${brand.supportEmail}.`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Password changed',
    contentHtml,
    contentText,
    preheader: 'Your password was changed',
  });

  return {
    subject: `Your ${brand.siteName} password was changed`,
    ...layout,
  };
}
