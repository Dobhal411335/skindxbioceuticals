import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { stripControlChars, validateSiteCode } from '../email.validation';
import type { RenderedEmail, WelcomeEmailInput } from '../email.types';

export function renderWelcomeEmail(
  input: Omit<WelcomeEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const displayName = input.displayName
    ? stripControlChars(input.displayName)
    : undefined;

  const greeting = displayName ? `Welcome, ${displayName}!` : 'Welcome!';

  const contentHtml = [
    paragraphHtml(greeting),
    paragraphHtml(
      `Thank you for joining ${brand.siteName}. We are glad to have you with us.`,
    ),
    ctaButtonHtml('Visit the website', brand.siteUrl),
    linkFallbackHtml(brand.siteUrl),
  ].join('');

  const contentText = [
    greeting,
    '',
    `Thank you for joining ${brand.siteName}. We are glad to have you with us.`,
    '',
    `Visit: ${brand.siteUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: `Welcome to ${brand.siteName}`,
    contentHtml,
    contentText,
    preheader: `Welcome to ${brand.siteName}`,
  });

  return {
    subject: `Welcome to ${brand.siteName}`,
    ...layout,
  };
}
