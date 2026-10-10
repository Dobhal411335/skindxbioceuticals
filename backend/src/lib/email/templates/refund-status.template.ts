import { getEmailBrand } from '../company/company.config';
import {
  mutedParagraphHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  requireNonEmptyString,
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { RefundStatusEmailInput, RenderedEmail } from '../email.types';

export function renderRefundStatusEmail(
  input: Omit<RefundStatusEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const refundAmount = requireNonEmptyString(input.refundAmount, 'refundAmount', 40);
  const currency = requireNonEmptyString(input.currency, 'currency', 10);
  const statusLabel = requireNonEmptyString(input.statusLabel, 'statusLabel', 100);
  const expectedTimeline = input.expectedTimeline
    ? stripControlChars(input.expectedTimeline)
    : undefined;

  const contentHtml = [
    paragraphHtml(`Refund update for order ${orderReference}.`),
    paragraphHtml(`Amount: ${refundAmount} ${currency}`),
    paragraphHtml(`Status: ${statusLabel}`),
    expectedTimeline
      ? paragraphHtml(expectedTimeline)
      : mutedParagraphHtml(
          'Any expected timeline will be shared only when confirmed by the payment provider or approved business rules.',
        ),
  ].join('');

  const contentText = [
    `Refund update for order ${orderReference}.`,
    `Amount: ${refundAmount} ${currency}`,
    `Status: ${statusLabel}`,
    expectedTimeline ??
      'Any expected timeline will be shared only when confirmed by the payment provider or approved business rules.',
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Refund status update',
    contentHtml,
    contentText,
    preheader: `Refund update for order ${orderReference}`,
  });

  return {
    subject: `Refund update — ${orderReference}`,
    ...layout,
  };
}
