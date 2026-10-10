/**
 * Non-sensitive company defaults for transactional email branding.
 * Do not invent logo URLs, postal addresses, phone numbers, or social links here.
 */
export const DEFAULT_COMPANY_NAME = 'SkinDx Bioc';

export const SITE_DISPLAY_NAMES = {
  IN: 'SkinDx Bioc India',
  COM: 'SkinDx Bioc',
} as const;

export function buildCopyrightText(companyName: string, year = new Date().getFullYear()): string {
  return `© ${year} ${companyName}. All rights reserved.`;
}
