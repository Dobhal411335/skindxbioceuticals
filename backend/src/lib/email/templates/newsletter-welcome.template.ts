import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { validateSiteCode } from '../email.validation';
import type { NewsletterWelcomeEmailInput, RenderedEmail } from '../email.types';

export function renderNewsletterWelcomeEmail(
  input: Omit<NewsletterWelcomeEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);

  const benefitsHtml = `
    <div style="background-color:#f0f7f4;border-left:4px solid #0f3d2e;padding:14px 16px;margin:20px 0;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 8px 0;font-weight:bold;color:#0f3d2e;font-size:14px;">What you can look forward to:</p>
      <ul style="margin:0;padding-left:18px;color:#333333;font-size:13px;line-height:1.6;">
        <li>Priority access to new bioceutical formulas & launches.</li>
        <li>Science-backed skincare tips curated by dermatologists.</li>
        <li>Subscriber-exclusive offers, promotions, and perks.</li>
      </ul>
    </div>
  `;

  const contentHtml = [
    paragraphHtml(`Thank you for subscribing to the ${brand.siteName} newsletter!`),
    paragraphHtml(
      `We're delighted to welcome you to our community. Our goal is to bring you clinically proven, high-performance skincare solutions that deliver visible, lasting results.`,
    ),
    benefitsHtml,
    ctaButtonHtml('Visit Our Website', brand.siteUrl),
    linkFallbackHtml(brand.siteUrl),
  ].join('');

  const contentText = [
    `Welcome to ${brand.siteName}!`,
    '',
    `Thank you for subscribing to our newsletter!`,
    `We're delighted to welcome you to our community. Our goal is to bring you clinically proven, high-performance skincare solutions that deliver visible, lasting results.`,
    '',
    'What you can look forward to:',
    '- Priority access to new bioceutical formulas & launches.',
    '- Science-backed skincare tips curated by dermatologists.',
    '- Subscriber-exclusive offers, promotions, and perks.',
    '',
    `Visit: ${brand.siteUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: `Welcome to ${brand.siteName}!`,
    contentHtml,
    contentText,
    preheader: `Thank you for subscribing to ${brand.siteName}. Welcome to our community.`,
    includeUnsubscribe: true,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  return {
    subject: `Welcome to ${brand.siteName}! Thank you for subscribing`,
    ...layout,
  };
}
