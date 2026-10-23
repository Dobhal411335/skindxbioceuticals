import { getEmailBrand } from '../company/company.config';
import { renderEmailLayout } from '../layouts/email-layout';
import { validateSiteCode } from '../email.validation';
import type { PromotionalEmailInput, RenderedEmail } from '../email.types';

export function renderPromotionalEmail(
  input: Omit<PromotionalEmailInput, 'to'>,
): RenderedEmail {
  const siteCode = validateSiteCode(input.siteCode);
  const brand = getEmailBrand(siteCode);

  const cleanSubject = input.subject.trim() || `Special Update from ${brand.siteName}`;
  const contentHtml = `<div style="font-size:15px;line-height:1.6;color:#1e293b;">${input.htmlContent}</div>`;
  const contentText = input.htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const layout = renderEmailLayout({
    brand,
    title: cleanSubject,
    contentHtml,
    contentText,
    preheader: cleanSubject,
    includeUnsubscribe: true,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  return {
    subject: cleanSubject,
    ...layout,
  };
}
