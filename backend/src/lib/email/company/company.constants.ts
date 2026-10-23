/**
 * Non-sensitive company defaults for transactional email branding.
 * Do not invent logo URLs, postal addresses, phone numbers, or social links here.
 */
export const DEFAULT_COMPANY_NAME = 'SkinDX Bioceuticals';
export const DEFAULT_COMPANY_PHONE = '+91 8800424431';

export const SITE_DISPLAY_NAMES = {
  IN: 'SkinDX Bioceuticals',
  COM: 'SkinDX Bioceuticals',
} as const;

export function buildCopyrightText(companyName: string, year = new Date().getFullYear()): string {
  return `© ${year} ${companyName}. All rights reserved.`;
}
