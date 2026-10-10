import { escapeHtml } from '../email.validation';
import type { EmailLayoutOptions, RenderedEmail } from '../email.types';
import { renderEmailFooterHtml, renderEmailFooterText } from './email-footer';
import { renderEmailHeaderHtml, renderEmailHeaderText } from './email-header';
import { emailStyles } from './email-styles';

/**
 * Shared transactional email layout — returns both HTML and plain text.
 */
export function renderEmailLayout(
  options: EmailLayoutOptions,
): Omit<RenderedEmail, 'subject'> {
  const { brand, title, contentHtml, contentText, preheader, includeUnsubscribe } = options;
  const safeTitle = escapeHtml(title);
  const safePreheader = preheader ? escapeHtml(preheader) : '';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="${emailStyles.body}">
    ${
      safePreheader
        ? `<div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.wrapper}">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.container}">
            ${renderEmailHeaderHtml(brand)}
            <tr>
              <td style="${emailStyles.content}">
                <h1 style="${emailStyles.title}">${safeTitle}</h1>
                ${contentHtml}
              </td>
            </tr>
            ${renderEmailFooterHtml(brand, { includeUnsubscribe })}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    renderEmailHeaderText(brand),
    '',
    title,
    '',
    contentText,
    '',
    renderEmailFooterText(brand, { includeUnsubscribe }),
  ].join('\n');

  return { html, text };
}

export function paragraphHtml(text: string): string {
  return `<p style="${emailStyles.paragraph}">${escapeHtml(text)}</p>`;
}

export function mutedParagraphHtml(text: string): string {
  return `<p style="${emailStyles.paragraph}${emailStyles.muted}">${escapeHtml(text)}</p>`;
}

export function ctaButtonHtml(label: string, href: string): string {
  return `<p style="${emailStyles.paragraph}"><a href="${escapeHtml(href)}" style="${emailStyles.button}">${escapeHtml(label)}</a></p>`;
}

export function linkFallbackHtml(href: string): string {
  return `<p style="${emailStyles.muted}">If the button does not work, copy and paste this link into your browser:<br />${escapeHtml(href)}</p>`;
}
