import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { EnquiryConfirmationEmailInput, RenderedEmail } from '../email.types';

export function renderEnquiryConfirmationEmail(
  input: Omit<EnquiryConfirmationEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const enquiryReference = input.enquiryReference
    ? stripControlChars(input.enquiryReference)
    : undefined;
  const expectedResponseTime = input.expectedResponseTime
    ? stripControlChars(input.expectedResponseTime)
    : undefined;

  const contentHtml = [
    paragraphHtml('Thank you — we have received your enquiry.'),
    enquiryReference
      ? paragraphHtml(`Your enquiry reference is ${enquiryReference}.`)
      : '',
    expectedResponseTime
      ? paragraphHtml(expectedResponseTime)
      : mutedParagraphHtml(
          'Our team will review your message and respond as soon as possible.',
        ),
    paragraphHtml(`If you need to follow up, contact ${brand.supportEmail}.`),
  ].join('');

  const contentText = [
    'Thank you — we have received your enquiry.',
    ...(enquiryReference ? [`Your enquiry reference is ${enquiryReference}.`] : []),
    expectedResponseTime ??
      'Our team will review your message and respond as soon as possible.',
    `If you need to follow up, contact ${brand.supportEmail}.`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Enquiry received',
    contentHtml,
    contentText,
    preheader: 'We have received your enquiry',
  });

  return {
    subject: enquiryReference
      ? `Enquiry received — ${enquiryReference}`
      : `We received your ${brand.siteName} enquiry`,
    ...layout,
  };
}
