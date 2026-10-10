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
import type { OrderDeliveredEmailInput, RenderedEmail } from '../email.types';

export function renderOrderDeliveredEmail(
  input: Omit<OrderDeliveredEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const orderDetailsUrl = assertSafeActionUrl(input.orderDetailsUrl, siteCode);

  const contentHtml = [
    paragraphHtml(`Order ${orderReference} has been marked as delivered.`),
    paragraphHtml('Thank you for shopping with us.'),
    ctaButtonHtml('View order details', orderDetailsUrl),
    linkFallbackHtml(orderDetailsUrl),
  ].join('');

  const contentText = [
    `Order ${orderReference} has been marked as delivered.`,
    'Thank you for shopping with us.',
    '',
    `View order details: ${orderDetailsUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Order delivered',
    contentHtml,
    contentText,
    preheader: `Order ${orderReference} delivered`,
  });

  return {
    subject: `Order delivered — ${orderReference}`,
    ...layout,
  };
}
