import request from 'supertest';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { ensureSites, resetDatabase } from '../setup/db';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    // Lazy call avoids TDZ when the singleton service constructs during import
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  })),
}));

jest.mock('@/lib/email', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue({ submitted: true }),
  },
}));

const app = createApp();
const api = () => request(app);

function googlePayload(overrides: Record<string, unknown> = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: env.GOOGLE_CLIENT_ID,
    sub: 'google-sub-integration-1',
    email: 'google.customer@skindx.test',
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    given_name: 'Google',
    family_name: 'Customer',
    picture: 'https://example.com/a.png',
    ...overrides,
  };
}

describe('Google authentication API', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
    mockVerifyIdToken.mockReset();
  });

  it('rejects a missing credential', async () => {
    const res = await api().post('/api/v1/auth/google').send({});
    expect(res.status).toBe(422);
  });

  it('rejects an invalid Google credential', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad token'));

    const res = await api().post('/api/v1/auth/google').send({ credential: 'invalid' });
    expect(res.status).toBe(401);
  });

  it('creates a customer session on first Google signup', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    const res = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user.email).toBe('google.customer@skindx.test');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining(env.AUTH_REFRESH_COOKIE_NAME)]),
    );

    const stored = await prisma.user.findUnique({
      where: { email: 'google.customer@skindx.test' },
      include: { externalIdentities: true },
    });
    expect(stored?.role).toBe('CUSTOMER');
    expect(stored?.passwordHash).toBeNull();
    expect(stored?.externalIdentities[0]?.providerUserId).toBe('google-sub-integration-1');
  });

  it('logs in a returning Google user without creating duplicates', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    await api().post('/api/v1/auth/google').send({ credential: 'token-1' });
    const second = await api().post('/api/v1/auth/google').send({ credential: 'token-2' });

    expect(second.status).toBe(200);
    expect(await prisma.user.count({ where: { email: 'google.customer@skindx.test' } })).toBe(1);
  });

  it('returns 409 when a password account already owns the email', async () => {
    await prisma.user.create({
      data: {
        email: 'google.customer@skindx.test',
        passwordHash: await hashPassword('StrongPass1!xx'),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    const res = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });
    expect(res.status).toBe(409);
  });

  it('rejects suspended Google-linked customers', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'google.customer@skindx.test',
        passwordHash: null,
        role: 'CUSTOMER',
        status: 'SUSPENDED',
        emailVerifiedAt: new Date(),
        externalIdentities: {
          create: {
            provider: 'GOOGLE',
            providerUserId: 'google-sub-integration-1',
          },
        },
      },
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload({ email: user.email }),
    });

    const res = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });
    expect(res.status).toBe(403);
  });

  it('returns /me for a Google customer session and denies admin dashboard', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    const login = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });
    const accessToken = login.body.data.accessToken as string;

    const me = await api()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe('CUSTOMER');
    expect(me.body.data.sites).toEqual([]);

    const adminDashboard = await api()
      .get('/api/v1/admin/sites/IN/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(adminDashboard.status).toBe(403);
  });

  it('returns 401 from /me without a session', async () => {
    const res = await api().get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('logs out and invalidates the refresh cookie session', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    const login = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });
    const cookies = login.headers['set-cookie'] as string[] | undefined;
    expect(cookies?.length).toBeGreaterThan(0);

    const logout = await api().post('/api/v1/auth/logout').set('Cookie', cookies ?? []);
    expect(logout.status).toBe(204);

    const refresh = await api().post('/api/v1/auth/refresh').set('Cookie', cookies ?? []).send({});
    expect(refresh.status).toBe(401);
  });

  it('does not expose password hashes or provider secrets in Google auth responses', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload(),
    });

    const res = await api().post('/api/v1/auth/google').send({ credential: 'valid-id-token' });
    const serialized = JSON.stringify(res.body);

    expect(serialized).not.toMatch(/passwordHash/i);
    expect(serialized).not.toMatch(/providerUserId/i);
    expect(res.body.data.refreshToken).toBeUndefined();
  });
});
