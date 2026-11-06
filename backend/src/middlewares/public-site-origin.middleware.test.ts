import { assertPublicSiteAccess } from '@/middlewares/public-site-origin.middleware';

const secret = 'test-site-fetch-secret-min-32-characters';
const base = {
  nodeEnv: 'production',
  siteInUrl: 'https://skindxbioceuticals.in',
  siteComUrl: 'https://skindxbioceuticals.com',
  expectedSecret: secret,
};

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
