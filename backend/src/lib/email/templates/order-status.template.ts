import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  assertSafeActionUrl,
  requireNonEmptyString,
  validateSiteCode,
} from '../email.validation';
import type { OrderStatusEmailInput, RenderedEmail } from '../email.types';

export function renderOrderStatusEmail(
  input: Omit<OrderStatusEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const statusLabel = requireNonEmptyString(input.statusLabel, 'statusLabel', 100);
  const orderDetailsUrl = assertSafeActionUrl(input.orderDetailsUrl, siteCode);

  const contentHtml = [
    paragraphHtml(`Your order ${orderReference} status is now: ${statusLabel}.`),
    ctaButtonHtml('View order details', orderDetailsUrl),
    linkFallbackHtml(orderDetailsUrl),
  ].join('');

  const contentText = [
    `Your order ${orderReference} status is now: ${statusLabel}.`,
    '',
    `View order details: ${orderDetailsUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Order status update',
    contentHtml,
    contentText,
    preheader: `Order ${orderReference}: ${statusLabel}`,
  });

  return {
    subject: `Order update — ${orderReference}`,
    ...layout,
  };
}
