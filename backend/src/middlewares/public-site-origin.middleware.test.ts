import { assertPublicSiteAccess } from '@/middlewares/public-site-origin.middleware';
import {
  expandCorsOriginsWithWwwTwins,
  isLocalHostname,
  isSameSitePublicOrigin,
  wwwTwinOrigin,
} from '@/lib/public-origin';

const secret = 'test-site-fetch-secret-min-32-characters';
const base = {
  nodeEnv: 'production',
  siteInUrl: 'https://ecommerce.skindxbioceuticals.in',
  siteComUrl: 'https://skindxbioceuticals.com',
  expectedSecret: secret,
};

describe('public origin helpers', () => {
  it('treats IPv6 localhost with or without brackets as local', () => {
    // Node URL.hostname keeps brackets for IPv6.
    expect(new URL('http://[::1]:3000').hostname).toBe('[::1]');
    expect(isLocalHostname('[::1]')).toBe(true);
    // Also accept the unbracketed form if hostname is supplied raw.
    expect(isLocalHostname('::1')).toBe(true);
    expect(wwwTwinOrigin('http://[::1]:3000')).toBeNull();
  });

  it('maps apex and www twins for IN and COM hosts', () => {
    expect(wwwTwinOrigin('https://skindxbioceuticals.com')).toBe(
      'https://www.skindxbioceuticals.com',
    );
    expect(wwwTwinOrigin('https://ecommerce.skindxbioceuticals.in')).toBe(
      'https://www.ecommerce.skindxbioceuticals.in',
    );
    expect(wwwTwinOrigin('http://localhost:3000')).toBeNull();
  });

  it('treats www and apex as the same public site origin', () => {
    expect(
      isSameSitePublicOrigin(
        'https://www.skindxbioceuticals.com',
        'https://skindxbioceuticals.com',
      ),
    ).toBe(true);
    expect(
      isSameSitePublicOrigin(
        'https://www.ecommerce.skindxbioceuticals.in',
        'https://ecommerce.skindxbioceuticals.in',
      ),
    ).toBe(true);
  });

  it('expands CORS origins with www twins', () => {
    expect(
      expandCorsOriginsWithWwwTwins([
        'https://skindxbioceuticals.com',
        'https://ecommerce.skindxbioceuticals.in',
        'http://localhost:3002',
      ]),
    ).toEqual([
      'https://skindxbioceuticals.com',
      'https://www.skindxbioceuticals.com',
      'https://ecommerce.skindxbioceuticals.in',
      'https://www.ecommerce.skindxbioceuticals.in',
      'http://localhost:3002',
    ]);
  });
});

describe('assertPublicSiteAccess', () => {
  it('allows a matching origin', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'COM',
        originHeader: 'https://skindxbioceuticals.com',
      }),
    ).not.toThrow();
  });

  it('allows www twin for COM SITE_COM_URL', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'COM',
        originHeader: 'https://www.skindxbioceuticals.com',
      }),
    ).not.toThrow();
  });

  it('allows www twin for IN SITE_IN_URL', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'IN',
        originHeader: 'https://www.ecommerce.skindxbioceuticals.in',
      }),
    ).not.toThrow();
  });

  it('rejects a .com origin that asks for IN even when the fetch secret is present', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'IN',
        originHeader: 'https://skindxbioceuticals.com',
        fetchSecret: secret,
      }),
    ).toThrow(/not allowed/i);
  });

  it('rejects a missing origin in production', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'COM',
      }),
    ).toThrow(/not allowed/i);
  });

  it('allows a missing origin when the server fetch secret matches', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        siteCode: 'COM',
        fetchSecret: secret,
      }),
    ).not.toThrow();
  });

  it('allows localhost only in development', () => {
    expect(() =>
      assertPublicSiteAccess({
        ...base,
        nodeEnv: 'development',
        siteCode: 'COM',
        originHeader: 'http://localhost:3000',
      }),
    ).not.toThrow();

    expect(() =>
      assertPublicSiteAccess({
        ...base,
        nodeEnv: 'production',
        siteCode: 'COM',
        originHeader: 'http://localhost:3000',
      }),
    ).toThrow(/not allowed/i);
  });
});
