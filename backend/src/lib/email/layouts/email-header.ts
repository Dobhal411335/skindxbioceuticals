import { escapeHtml } from '../email.validation';
import type { EmailBrand } from '../email.types';
import { emailStyles } from './email-styles';

export function renderEmailHeaderHtml(brand: EmailBrand): string {
  const companyName = escapeHtml(brand.companyName);
  const siteName = escapeHtml(brand.siteName);
  const siteUrl = escapeHtml(brand.siteUrl);

  const logoBlock = brand.logoUrl
    ? `<a href="${siteUrl}" style="text-decoration:none;">
         <img src="${escapeHtml(brand.logoUrl)}" alt="${companyName} logo" width="140" style="display:block;border:0;outline:none;max-width:140px;height:auto;" />
         <div style="font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all;">${siteName}</div>
       </a>`
    : `<a href="${siteUrl}" style="${emailStyles.brandText}">${siteName}</a>`;

  return `
    <tr>
      <td style="${emailStyles.header}">
        ${logoBlock}
        ${
          brand.logoUrl
            ? `<div style="margin-top:10px;font-size:14px;color:#d9efe6;">${siteName}</div>`
            : ''
        }
      </td>
    </tr>
  `;
}

export function renderEmailHeaderText(brand: EmailBrand): string {
  return `${brand.siteName}\n${brand.siteUrl}`;
}
