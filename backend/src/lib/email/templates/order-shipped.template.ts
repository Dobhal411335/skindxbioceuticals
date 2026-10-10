import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  assertHttpUrl,
  assertSafeActionUrl,
  requireNonEmptyString,
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { OrderShippedEmailInput, RenderedEmail } from '../email.types';

export function renderOrderShippedEmail(
  input: Omit<OrderShippedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const orderDetailsUrl = assertSafeActionUrl(input.orderDetailsUrl, siteCode);
  const carrier = input.carrier ? stripControlChars(input.carrier) : undefined;
  const trackingReference = input.trackingReference
    ? stripControlChars(input.trackingReference)
    : undefined;
  // Tracking URLs must come from a trusted shipping integration; only protocol is validated here.
  const trackingUrl = input.trackingUrl
    ? assertHttpUrl(input.trackingUrl, 'trackingUrl')
    : undefined;

  const contentHtml = [
    paragraphHtml(`Good news — order ${orderReference} has shipped.`),
    carrier ? paragraphHtml(`Carrier: ${carrier}`) : '',
    trackingReference ? paragraphHtml(`Tracking reference: ${trackingReference}`) : '',
    trackingUrl ? ctaButtonHtml('Track shipment', trackingUrl) : '',
    trackingUrl ? linkFallbackHtml(trackingUrl) : '',
    ctaButtonHtml('View order details', orderDetailsUrl),
    linkFallbackHtml(orderDetailsUrl),
  ].join('');

  const contentText = [
    `Good news — order ${orderReference} has shipped.`,
    ...(carrier ? [`Carrier: ${carrier}`] : []),
    ...(trackingReference ? [`Tracking reference: ${trackingReference}`] : []),
    ...(trackingUrl ? [`Track shipment: ${trackingUrl}`] : []),
    '',
    `View order details: ${orderDetailsUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Your order has shipped',
    contentHtml,
    contentText,
    preheader: `Order ${orderReference} shipped`,
  });

  return {
    subject: `Order shipped — ${orderReference}`,
    ...layout,
  };
}
