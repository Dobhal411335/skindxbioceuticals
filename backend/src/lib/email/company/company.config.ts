import { env } from '@/config/env';
import type { SiteCode } from '@/types/common';
import type { EmailBrand } from '../email.types';
import { buildCopyrightText, DEFAULT_COMPANY_NAME, SITE_DISPLAY_NAMES } from './company.constants';

/**
 * Returns site-specific branding for transactional emails.
 * Both sites share the same email infrastructure; only brand/links differ.
 */
export function getEmailBrand(siteCode: SiteCode): EmailBrand {
  const companyName = env.COMPANY_NAME || DEFAULT_COMPANY_NAME;
  const siteUrl = siteCode === 'IN' ? env.SITE_IN_URL : env.SITE_COM_URL;

  return {
    siteCode,
    companyName,
    siteName: SITE_DISPLAY_NAMES[siteCode],
    siteUrl: stripTrailingSlash(siteUrl),
    supportEmail: env.SUPPORT_EMAIL,
    logoUrl: env.COMPANY_LOGO_URL,
    privacyPolicyUrl: env.PRIVACY_POLICY_URL,
    copyrightText: buildCopyrightText(companyName),
  };
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
