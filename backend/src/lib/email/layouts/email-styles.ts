/**
 * Conservative inline style snippets for email-client compatibility.
 * Prefer tables + inline CSS; avoid external stylesheets and JavaScript.
 */
export const emailStyles = {
  body: 'margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222222;',
  wrapper: 'width:100%;background-color:#f5f5f5;padding:24px 0;',
  container:
    'max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;',
  header:
    'padding:24px 28px;background-color:#0f3d2e;color:#ffffff;text-align:left;',
  brandText: 'font-size:20px;font-weight:bold;letter-spacing:0.3px;color:#ffffff;text-decoration:none;',
  content: 'padding:28px;font-size:15px;line-height:1.6;color:#222222;',
  title: 'margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#0f3d2e;',
  paragraph: 'margin:0 0 14px 0;',
  button:
    'display:inline-block;padding:12px 20px;background-color:#0f3d2e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;',
  muted: 'color:#666666;font-size:13px;line-height:1.5;',
  footer:
    'padding:20px 28px;background-color:#f0f0f0;color:#555555;font-size:12px;line-height:1.5;',
  footerLink: 'color:#0f3d2e;text-decoration:underline;',
  table: 'width:100%;border-collapse:collapse;margin:16px 0;',
  th: 'text-align:left;padding:8px;border-bottom:1px solid #dddddd;font-size:13px;color:#555555;',
  td: 'padding:8px;border-bottom:1px solid #eeeeee;font-size:14px;color:#222222;',
  codeBox:
    'display:inline-block;padding:12px 18px;background-color:#f0f7f4;border:1px solid #cfe3da;border-radius:6px;font-size:24px;letter-spacing:4px;font-weight:bold;color:#0f3d2e;',
} as const;
