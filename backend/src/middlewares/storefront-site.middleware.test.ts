import { ForbiddenError, ValidationError } from '@/utils/AppError';
import { resolveStorefrontSiteCode } from './storefront-site.middleware';

const base = {
  nodeEnv: 'production',
  siteInUrl: 'https://skindxbioceuticals.in',
  siteComUrl: 'https://skindxbioceuticals.com',
  expectedSecret: 'test-site-fetch-secret-min-32-characters',
};

describe('resolveStorefrontSiteCode', () => {
  it('maps IN origin to IN and rejects a mismatched storefront header', () => {
    expect(
      resolveStorefrontSiteCode({
        ...base,
        originHeader: 'https://skindxbioceuticals.in',
        declaredSiteHeader: 'IN',
      }),
    ).toBe('IN');

    expect(() =>
      resolveStorefrontSiteCode({
        ...base,
        originHeader: 'https://skindxbioceuticals.in',
        declaredSiteHeader: 'COM',
      }),
    ).toThrow(ForbiddenError);
  });

  it('maps COM origin to COM', () => {
    expect(
      resolveStorefrontSiteCode({
        ...base,
        originHeader: 'https://www.skindxbioceuticals.com',
        declaredSiteHeader: 'COM',
      }),
    ).toBe('COM');
  });

  it('requires X-Storefront-Site for server fetches with SITE_FETCH_SECRET', () => {
    expect(() =>
      resolveStorefrontSiteCode({
        ...base,
        fetchSecret: base.expectedSecret,
      }),
    ).toThrow(ValidationError);

    expect(
      resolveStorefrontSiteCode({
        ...base,
        fetchSecret: base.expectedSecret,
        declaredSiteHeader: 'COM',
      }),
    ).toBe('COM');
  });

  it('on local development hosts requires and trusts X-Storefront-Site even when Origin matches SITE_IN_URL', () => {
    expect(
      resolveStorefrontSiteCode({
        ...base,
        nodeEnv: 'development',
        siteInUrl: 'http://localhost:3000',
        siteComUrl: 'http://localhost:3001',
        originHeader: 'http://localhost:3000',
        declaredSiteHeader: 'COM',
      }),
    ).toBe('COM');

    expect(() =>
      resolveStorefrontSiteCode({
        ...base,
        nodeEnv: 'development',
        siteInUrl: 'http://localhost:3000',
        siteComUrl: 'http://localhost:3001',
        originHeader: 'http://localhost:3000',
      }),
    ).toThrow(ValidationError);
  });
});
