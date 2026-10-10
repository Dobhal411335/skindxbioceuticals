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
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { OrderCancelledEmailInput, RenderedEmail } from '../email.types';

export function renderOrderCancelledEmail(
  input: Omit<OrderCancelledEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const orderDetailsUrl = input.orderDetailsUrl
    ? assertSafeActionUrl(input.orderDetailsUrl, siteCode)
    : undefined;
  const refundSummary = input.refundSummary
    ? stripControlChars(input.refundSummary)
    : undefined;

  const contentHtml = [
    paragraphHtml(`Order ${orderReference} has been cancelled.`),
    input.refundConfirmed && refundSummary
      ? paragraphHtml(refundSummary)
      : mutedParagraphHtml(
          'Refund details will be shared only after the backend confirms a refund.',
        ),
    orderDetailsUrl ? ctaButtonHtml('View order details', orderDetailsUrl) : '',
    orderDetailsUrl ? linkFallbackHtml(orderDetailsUrl) : '',
  ].join('');

  const contentText = [
    `Order ${orderReference} has been cancelled.`,
    input.refundConfirmed && refundSummary
      ? refundSummary
      : 'Refund details will be shared only after the backend confirms a refund.',
    ...(orderDetailsUrl ? ['', `View order details: ${orderDetailsUrl}`] : []),
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Order cancelled',
    contentHtml,
    contentText,
    preheader: `Order ${orderReference} cancelled`,
  });

  return {
    subject: `Order cancelled — ${orderReference}`,
    ...layout,
  };
}
