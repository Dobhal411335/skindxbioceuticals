import { escapeHtml } from '../email.validation';
import type { EmailBrand } from '../email.types';
import { emailStyles } from './email-styles';

export interface EmailFooterOptions {
  includeUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

export function renderEmailFooterHtml(
  brand: EmailBrand,
  options: EmailFooterOptions = {},
): string {
  const supportEmail = escapeHtml(brand.supportEmail);
  const siteUrl = escapeHtml(brand.siteUrl);
  const companyName = escapeHtml(brand.companyName);
  const copyright = escapeHtml(brand.copyrightText);

  const privacy = brand.privacyPolicyUrl
    ? `<br /><a href="${escapeHtml(brand.privacyPolicyUrl)}" style="${emailStyles.footerLink}">Privacy Policy</a>`
    : '';

  // Promotional/newsletter unsubscribe button and link
  const unsubscribe = options.unsubscribeUrl
    ? `<br /><span style="${emailStyles.muted}">No longer wish to receive promotional updates? </span><a href="${escapeHtml(options.unsubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="${emailStyles.footerLink}; color: #6b7280; text-decoration: underline;">Unsubscribe</a>`
    : options.includeUnsubscribe
    ? `<br /><span style="${emailStyles.muted}">You can unsubscribe from marketing emails using the link provided in those messages.</span>`
    : '';

  const phoneBlock = brand.companyPhone
    ? `&nbsp;·&nbsp; Phone / WhatsApp: <a href="tel:${escapeHtml(brand.companyPhone)}" style="${emailStyles.footerLink}">${escapeHtml(brand.companyPhone)}</a>`
    : '';

  return `
    <tr>
      <td style="${emailStyles.footer}">
        <p style="margin:0 0 8px 0;">
          Need help? Contact
          <a href="mailto:${supportEmail}" style="${emailStyles.footerLink}">${supportEmail}</a>
          ${phoneBlock}
        </p>
        <p style="margin:0 0 8px 0;">
          <a href="${siteUrl}" style="${emailStyles.footerLink}">${escapeHtml(brand.siteName)}</a>
          ${companyName && companyName !== brand.siteName ? `&nbsp;·&nbsp; ${companyName}` : ''}
        </p>
        <p style="margin:0;">${copyright}${privacy}${unsubscribe}</p>
      </td>
    </tr>
  `;
}

export function renderEmailFooterText(
  brand: EmailBrand,
  options: EmailFooterOptions = {},
): string {
  const contactHelp = brand.companyPhone
    ? `Need help? Contact ${brand.supportEmail} | Phone / WhatsApp: ${brand.companyPhone}`
    : `Need help? Contact ${brand.supportEmail}`;

  const lines = [
    contactHelp,
    `${brand.siteName}: ${brand.siteUrl}`,
    brand.copyrightText,
  ];

  if (brand.privacyPolicyUrl) {
    lines.push(`Privacy Policy: ${brand.privacyPolicyUrl}`);
  }

  if (options.unsubscribeUrl) {
    lines.push(`Unsubscribe: ${options.unsubscribeUrl}`);
  } else if (options.includeUnsubscribe) {
    lines.push(
      'You can unsubscribe from marketing emails using the link provided in those messages.',
    );
  }

  return lines.join('\n');
}
