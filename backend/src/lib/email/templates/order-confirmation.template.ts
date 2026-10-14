import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { emailStyles } from '../layouts/email-styles';
import {
  assertSafeActionUrl,
  escapeHtml,
  requireNonEmptyString,
  validateSiteCode,
} from '../email.validation';
import type {
  OrderConfirmationEmailInput,
  OrderLineItemEmailData,
  RenderedEmail,
  ShippingAddressEmailData,
} from '../email.types';
import { EmailValidationError } from '../email.errors';

export function renderOrderConfirmationEmail(
  input: Omit<OrderConfirmationEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const orderReference = requireNonEmptyString(input.orderReference, 'orderReference', 100);
  const orderDetailsUrl = assertSafeActionUrl(input.orderDetailsUrl, siteCode);
  const items = input.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    throw new EmailValidationError('Order confirmation requires at least one item');
  }

  const currency = requireNonEmptyString(input.breakdown.currency, 'currency', 10);
  const total = requireNonEmptyString(input.breakdown.total, 'total', 40);

  const contentHtml = [
    paragraphHtml(`Thank you for your order. Your order reference is ${orderReference}.`),
    renderItemsTableHtml(items),
    renderBreakdownHtml(input.breakdown, currency, total),
    input.shippingAddress ? renderAddressHtml(input.shippingAddress) : '',
    ctaButtonHtml('View order details', orderDetailsUrl),
    linkFallbackHtml(orderDetailsUrl),
  ].join('');

  const contentText = [
    `Thank you for your order. Your order reference is ${orderReference}.`,
    '',
    ...items.map(
      (item) =>
        `- ${item.name} x ${item.quantity} @ ${item.unitPrice} = ${item.lineTotal}`,
    ),
    '',
    ...renderBreakdownText(input.breakdown, currency, total),
    ...(input.shippingAddress
      ? ['', 'Shipping address:', ...formatAddressLines(input.shippingAddress)]
      : []),
    '',
    `View order details: ${orderDetailsUrl}`,
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Order confirmation',
    contentHtml,
    contentText,
    preheader: `Order ${orderReference} confirmed`,
  });

  return {
    subject: `Order confirmed — ${orderReference}`,
    ...layout,
  };
}

function renderItemsTableHtml(items: OrderLineItemEmailData[]): string {
  const rows = items
    .map((item) => {
      const name = escapeHtml(requireNonEmptyString(item.name, 'item.name', 300));
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new EmailValidationError('Item quantity must be a positive integer');
      }
      return `<tr>
        <td style="${emailStyles.td}">${name}</td>
        <td style="${emailStyles.td}">${quantity}</td>
        <td style="${emailStyles.td}">${escapeHtml(requireNonEmptyString(item.unitPrice, 'item.unitPrice', 40))}</td>
        <td style="${emailStyles.td}">${escapeHtml(requireNonEmptyString(item.lineTotal, 'item.lineTotal', 40))}</td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" style="${emailStyles.table}" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th style="${emailStyles.th}">Item</th>
        <th style="${emailStyles.th}">Qty</th>
        <th style="${emailStyles.th}">Price</th>
        <th style="${emailStyles.th}">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderBreakdownHtml(
  breakdown: OrderConfirmationEmailInput['breakdown'],
  currency: string,
  total: string,
): string {
  const lines: string[] = [];
  if (breakdown.subtotal) {
    lines.push(row('Subtotal', breakdown.subtotal));
  }
  if (breakdown.discount) {
    lines.push(row('Discount', breakdown.discount));
  }
  if (breakdown.shipping) {
    lines.push(row('Shipping', breakdown.shipping));
  }
  if (breakdown.cgst && Number(breakdown.cgst) > 0) {
    lines.push(row('CGST', breakdown.cgst));
  }
  if (breakdown.sgst && Number(breakdown.sgst) > 0) {
    lines.push(row('SGST', breakdown.sgst));
  } else if (breakdown.tax && Number(breakdown.tax) > 0 && !(breakdown.cgst || breakdown.sgst)) {
    lines.push(row('Tax', breakdown.tax));
  }
  lines.push(row(`Total (${currency})`, total));
  return `<table role="presentation" style="${emailStyles.table}" cellpadding="0" cellspacing="0">${lines.join('')}</table>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="${emailStyles.td}">${escapeHtml(label)}</td>
    <td style="${emailStyles.td}">${escapeHtml(value)}</td>
  </tr>`;
}

function renderBreakdownText(
  breakdown: OrderConfirmationEmailInput['breakdown'],
  currency: string,
  total: string,
): string[] {
  const lines: string[] = [];
  if (breakdown.subtotal) lines.push(`Subtotal: ${breakdown.subtotal}`);
  if (breakdown.discount) lines.push(`Discount: ${breakdown.discount}`);
  if (breakdown.shipping) lines.push(`Shipping: ${breakdown.shipping}`);
  if (breakdown.cgst && Number(breakdown.cgst) > 0) {
    lines.push(`CGST: ${breakdown.cgst}`);
  }
  if (breakdown.sgst && Number(breakdown.sgst) > 0) {
    lines.push(`SGST: ${breakdown.sgst}`);
  } else if (breakdown.tax && Number(breakdown.tax) > 0 && !(breakdown.cgst || breakdown.sgst)) {
    lines.push(`Tax: ${breakdown.tax}`);
  }
  lines.push(`Total (${currency}): ${total}`);
  return lines;
}

function renderAddressHtml(address: ShippingAddressEmailData): string {
  return `<p style="${emailStyles.paragraph}"><strong>Shipping address</strong><br />${formatAddressLines(address)
    .map((line) => escapeHtml(line))
    .join('<br />')}</p>`;
}

function formatAddressLines(address: ShippingAddressEmailData): string[] {
  return [
    address.name,
    requireNonEmptyString(address.line1, 'shippingAddress.line1', 200),
    address.line2,
    [
      requireNonEmptyString(address.city, 'shippingAddress.city', 100),
      address.state,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(', '),
    requireNonEmptyString(address.country, 'shippingAddress.country', 100),
  ].filter((line): line is string => Boolean(line && String(line).trim()));
}
