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
  stripControlChars,
  validateSiteCode,
} from '../email.validation';
import type { PaymentSuccessEmailInput, RenderedEmail } from '../email.types';

export function renderPaymentSuccessEmail(
  input: Omit<PaymentSuccessEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const amount = requireNonEmptyString(input.amount, 'amount', 40);
  const currency = requireNonEmptyString(input.currency, 'currency', 10);
  const paymentReference = input.paymentReference
    ? stripControlChars(input.paymentReference)
    : undefined;
  const orderDetailsUrl = input.orderDetailsUrl
    ? assertSafeActionUrl(input.orderDetailsUrl, siteCode)
    : undefined;

  const contentHtml = [
    paragraphHtml(`Payment for order ${orderReference} was successful.`),
    paragraphHtml(`Amount: ${amount} ${currency}`),
    paymentReference
      ? paragraphHtml(`Payment reference: ${paymentReference}`)
      : '',
    orderDetailsUrl ? ctaButtonHtml('View order details', orderDetailsUrl) : '',
    orderDetailsUrl ? linkFallbackHtml(orderDetailsUrl) : '',
  ].join('');

  const contentText = [
    `Payment for order ${orderReference} was successful.`,
    `Amount: ${amount} ${currency}`,
    ...(paymentReference ? [`Payment reference: ${paymentReference}`] : []),
    ...(orderDetailsUrl ? ['', `View order details: ${orderDetailsUrl}`] : []),
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Payment successful',
    contentHtml,
    contentText,
    preheader: `Payment received for order ${orderReference}`,
  });

  return {
    subject: `Payment successful — ${orderReference}`,
    ...layout,
  };
}
