import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  assertSafeActionUrl,
  requireNonEmptyString,
  validateSiteCode,
} from '../email.validation';
import type { PaymentFailedEmailInput, RenderedEmail } from '../email.types';

export function renderPaymentFailedEmail(
  input: Omit<PaymentFailedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const safeFailureMessage = requireNonEmptyString(
    input.safeFailureMessage,
    'safeFailureMessage',
    500,
  );
  const retryUrl = input.retryUrl
    ? assertSafeActionUrl(input.retryUrl, siteCode)
    : undefined;

  const contentHtml = [
    paragraphHtml(`We could not complete payment for order ${orderReference}.`),
    paragraphHtml(safeFailureMessage),
    retryUrl ? ctaButtonHtml('Try again', retryUrl) : '',
    retryUrl ? linkFallbackHtml(retryUrl) : '',
    mutedParagraphHtml(
      `If you need help, contact ${brand.supportEmail}. No sensitive payment provider details are included in this message.`,
    ),
  ].join('');

  const contentText = [
    `We could not complete payment for order ${orderReference}.`,
    safeFailureMessage,
    ...(retryUrl ? ['', `Try again: ${retryUrl}`] : []),
    '',
    `If you need help, contact ${brand.supportEmail}.`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Payment unsuccessful',
    contentHtml,
    contentText,
    preheader: `Payment issue for order ${orderReference}`,
  });

  return {
    subject: `Payment unsuccessful — ${orderReference}`,
    ...layout,
  };
}
