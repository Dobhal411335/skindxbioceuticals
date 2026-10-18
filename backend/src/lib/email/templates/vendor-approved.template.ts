import { getEmailBrand } from '../company/company.config';
import {
  ctaButtonHtml,
  linkFallbackHtml,
  paragraphHtml,
  renderEmailLayout,
} from '../layouts/email-layout';
import { escapeHtml, stripControlChars, validateSiteCode } from '../email.validation';
import type { RenderedEmail, VendorApprovedEmailInput } from '../email.types';

export function renderVendorApprovedEmail(
  input: Omit<VendorApprovedEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);
  const contactPerson = stripControlChars(input.contactPerson);
  const username = stripControlChars(input.username);
  const password = stripControlChars(input.password);
  const loginUrl = `${brand.siteUrl}/vendor/login`;

  const contentHtml = [
    paragraphHtml(`Dear ${escapeHtml(contactPerson)},`),
    paragraphHtml(
      `We are pleased to inform you that your vendor application with ${escapeHtml(brand.siteName)} has been approved. You can now sign in with the credentials below:`,
    ),
    `<div style="background:#fff;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Login URL:</strong> <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
      <p style="margin:0 0 8px;"><strong>Username:</strong> ${escapeHtml(username)}</p>
      <p style="margin:0;"><strong>Password:</strong> ${escapeHtml(password)}</p>
    </div>`,
    ctaButtonHtml('Vendor Login', loginUrl),
    linkFallbackHtml(loginUrl),
    paragraphHtml(
      'If you have any questions, please contact our support team.',
    ),
  ].join('');

  const contentText = [
    `Dear ${contactPerson},`,
    '',
    `Your vendor application with ${brand.siteName} has been approved.`,
    '',
    `Login URL: ${loginUrl}`,
    `Username: ${username}`,
    `Password: ${password}`,
    '',
    'If you have any questions, please contact our support team.',
  ].join('\n');

  const layout = renderEmailLayout({
    brand,
    title: 'Vendor account approved',
    contentHtml,
    contentText,
    preheader: `Your ${brand.siteName} vendor account is ready`,
  });

  return {
    subject: `Your ${brand.siteName} vendor account is approved`,
    ...layout,
  };
}
