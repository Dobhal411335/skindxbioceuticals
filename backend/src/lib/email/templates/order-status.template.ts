import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import {
  assertSafeActionUrl,
  escapeHtml,
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
  const targetTrackingUrl = input.trackingUrl || input.orderDetailsUrl;
  const safeTrackingUrl = assertSafeActionUrl(targetTrackingUrl, siteCode);
  const statusMessage = input.statusMessage?.trim();

  const messageBoxHtml = statusMessage
    ? `<div style="margin: 18px 0; padding: 14px 16px; background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 4px;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em;">Update Note</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155; line-height: 1.5;">${escapeHtml(statusMessage)}</p>
      </div>`
    : '';

  const contentHtml = [
    paragraphHtml(`Your order #${orderReference} status is now: ${statusLabel}.`),
    messageBoxHtml,
    ctaButtonHtml('Track your order', safeTrackingUrl),
    linkFallbackHtml(safeTrackingUrl),
  ].join('');

  const messageText = statusMessage ? `\nStatus update note: ${statusMessage}\n` : '';

  const contentText = [
    `Your order #${orderReference} status is now: ${statusLabel}.`,
    messageText,
    `Track your order: ${safeTrackingUrl}`,
  ].filter(Boolean).join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Order status update',
    contentHtml,
    contentText,
    preheader: `Order #${orderReference}: ${statusLabel}`,
  });

  return {
    subject: `Order update — #${orderReference} is ${statusLabel}`,
    ...layout,
  };
}
