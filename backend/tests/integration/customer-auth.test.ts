import request from 'supertest';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { sha256 } from '@/lib/crypto';
import { emailService } from '@/lib/email';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { EMAIL_NOT_VERIFIED_CODE } from '@/features/auth/auth.types';
import { ensureSites, resetDatabase } from '../setup/db';

jest.mock('@/lib/email', () => ({
  emailService: {
    sendOtpEmail: jest.fn().mockResolvedValue({ submitted: true }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({ submitted: true }),
  },
}));

const sendOtpEmail = emailService.sendOtpEmail as jest.Mock;
const sendWelcomeEmail = emailService.sendWelcomeEmail as jest.Mock;

const app = createApp();
const api = () => request(app);

const STRONG_PASSWORD = 'StrongPass1!xx';

function registerBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@skindx.test',
    password: STRONG_PASSWORD,
    confirmPassword: STRONG_PASSWORD,
    ...overrides,
  };
}

async function latestOtpPlaintext(): Promise<string> {
  const call = sendOtpEmail.mock.calls.at(-1)?.[0] as { otpCode?: string } | undefined;
  if (!call?.otpCode) {
    throw new Error('Expected sendOtpEmail to have been called with an otpCode');
  }
  return call.otpCode;
}

describe('Customer email/password authentication API', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
    sendOtpEmail.mockClear();
    sendWelcomeEmail.mockClear();
    sendOtpEmail.mockResolvedValue({ submitted: true });
    sendWelcomeEmail.mockResolvedValue({ submitted: true });
  });

  describe('POST /auth/register', () => {
    it('creates a pending account and sends an OTP without establishing a session', async () => {
      const res = await api().post('/api/v1/auth/register').send(registerBody());

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({
        verificationRequired: true,
        email: 'ada@skindx.test',
      });
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.headers['set-cookie']).toBeUndefined();

      const user = await prisma.user.findUnique({ where: { email: 'ada@skindx.test' } });
      expect(user?.status).toBe('PENDING_VERIFICATION');
      expect(user?.emailVerifiedAt).toBeNull();
      expect(user?.passwordHash).toBeTruthy();
      expect(user?.firstName).toBe('Ada');
      expect(user?.lastName).toBe('Lovelace');

      const tokens = await prisma.emailVerificationToken.findMany({
        where: { userId: user!.id },
      });
      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.tokenHash).toBe(sha256(await latestOtpPlaintext()));
      expect(tokens[0]?.tokenHash).not.toBe(await latestOtpPlaintext());
      expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    });

    it('rejects weak passwords and mismatched confirmation', async () => {
      const weak = await api()
        .post('/api/v1/auth/register')
        .send(registerBody({ password: 'short', confirmPassword: 'short' }));
      expect(weak.status).toBe(422);

      const mismatch = await api()
        .post('/api/v1/auth/register')
        .send(registerBody({ confirmPassword: 'DifferentPass1!' }));
      expect(mismatch.status).toBe(422);
    });

    it('rejects duplicate active emails', async () => {
      await prisma.user.create({
        data: {
          email: 'ada@skindx.test',
          passwordHash: await hashPassword(STRONG_PASSWORD),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      const res = await api().post('/api/v1/auth/register').send(registerBody());
      expect(res.status).toBe(409);
    });

    it('rejects registration when a Google-only account owns the email', async () => {
      await prisma.user.create({
        data: {
          email: 'ada@skindx.test',
          passwordHash: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          externalIdentities: {
            create: {
              provider: 'GOOGLE',
              providerUserId: 'google-sub-ada',
            },
          },
        },
      });

      const res = await api().post('/api/v1/auth/register').send(registerBody());
      expect(res.status).toBe(409);
    });

    it('still returns verification required when Brevo OTP send fails', async () => {
      sendOtpEmail.mockRejectedValueOnce(new Error('brevo down'));

      const res = await api().post('/api/v1/auth/register').send(registerBody());
      expect(res.status).toBe(201);
      expect(res.body.data.verificationRequired).toBe(true);
      expect(await prisma.user.count({ where: { email: 'ada@skindx.test' } })).toBe(1);
    });
  });

  describe('POST /auth/verify-email', () => {
    async function registerAndGetOtp() {
      await api().post('/api/v1/auth/register').send(registerBody());
      return latestOtpPlaintext();
    }

    it('verifies a valid OTP, issues credentials once, and sends welcome once', async () => {
      const otp = await registerAndGetOtp();

      const res = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.user.email).toBe('ada@skindx.test');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining(env.AUTH_REFRESH_COOKIE_NAME)]),
      );

      const user = await prisma.user.findUnique({ where: { email: 'ada@skindx.test' } });
      expect(user?.status).toBe('ACTIVE');
      expect(user?.emailVerifiedAt).toBeTruthy();
      expect(user?.welcomeEmailSentAt).toBeTruthy();
      expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

      const reused = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp,
      });
      expect(reused.status).toBe(409);
      expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    it('rejects incorrect and expired OTPs', async () => {
      await registerAndGetOtp();

      const wrong = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp: '000000',
      });
      expect(wrong.status).toBe(422);

      const token = await prisma.emailVerificationToken.findFirst({
        where: { consumedAt: null },
      });
      await prisma.emailVerificationToken.update({
        where: { id: token!.id },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });

      const expired = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp: await latestOtpPlaintext(),
      });
      expect(expired.status).toBe(422);
    });

    it('enforces maximum OTP attempts', async () => {
      await registerAndGetOtp();

      for (let i = 0; i < env.OTP_MAX_ATTEMPTS; i += 1) {
        const res = await api().post('/api/v1/auth/verify-email').send({
          email: 'ada@skindx.test',
          otp: '000000',
        });
        expect(res.status).toBe(422);
      }

      const afterMax = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp: await latestOtpPlaintext(),
      });
      expect(afterMax.status).toBe(422);
    });

    it('only one concurrent verification succeeds', async () => {
      const otp = await registerAndGetOtp();

      const [first, second] = await Promise.all([
        api().post('/api/v1/auth/verify-email').send({ email: 'ada@skindx.test', otp }),
        api().post('/api/v1/auth/verify-email').send({ email: 'ada@skindx.test', otp }),
      ]);

      const statuses = [first.status, second.status].sort((a, b) => a - b);
      expect(statuses[0]).toBe(200);
      expect([409, 422]).toContain(statuses[1]);
      expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });

    it('keeps the account verified when welcome email fails', async () => {
      const otp = await registerAndGetOtp();
      sendWelcomeEmail.mockResolvedValueOnce({
        submitted: false,
        errorMessage: 'provider unavailable',
      });

      const res = await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp,
      });

      expect(res.status).toBe(200);
      const user = await prisma.user.findUnique({ where: { email: 'ada@skindx.test' } });
      expect(user?.status).toBe('ACTIVE');
      expect(user?.welcomeEmailSentAt).toBeNull();

      const outbox = await prisma.emailOutbox.findFirst({
        where: { userId: user!.id, templateKey: 'WELCOME' },
      });
      expect(outbox?.status).toBe('FAILED');
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('returns a generic acknowledgement and respects cooldown', async () => {
      await api().post('/api/v1/auth/register').send(registerBody());
      sendOtpEmail.mockClear();

      const first = await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'ada@skindx.test' });
      expect(first.status).toBe(200);
      expect(first.body.data.accepted).toBe(true);
      // Within cooldown — no new OTP
      expect(sendOtpEmail).not.toHaveBeenCalled();

      const unknown = await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'missing@skindx.test' });
      expect(unknown.status).toBe(200);
      expect(unknown.body.data.accepted).toBe(true);
    });
  });

  describe('POST /auth/login', () => {
    async function createVerifiedCustomer() {
      await api().post('/api/v1/auth/register').send(registerBody());
      const otp = await latestOtpPlaintext();
      await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp,
      });
      sendWelcomeEmail.mockClear();
    }

    it('logs in a verified customer with cookie refresh and no password hash leakage', async () => {
      await createVerifiedCustomer();

      const res = await api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: STRONG_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/i);
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining(env.AUTH_REFRESH_COOKIE_NAME)]),
      );
      expect(sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('returns generic errors for invalid credentials and unknown accounts', async () => {
      await createVerifiedCustomer();

      const badPassword = await api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: 'WrongPass1!xx',
      });
      expect(badPassword.status).toBe(401);

      const unknown = await api().post('/api/v1/auth/login').send({
        email: 'nobody@skindx.test',
        password: STRONG_PASSWORD,
      });
      expect(unknown.status).toBe(401);
    });

    it('directs unverified accounts to email verification', async () => {
      await api().post('/api/v1/auth/register').send(registerBody());

      const res = await api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: STRONG_PASSWORD,
      });

      expect(res.status).toBe(403);
      expect(res.body.errors).toEqual(
        expect.objectContaining({
          code: EMAIL_NOT_VERIFIED_CODE,
          email: 'ada@skindx.test',
        }),
      );
      expect(res.body.data?.accessToken).toBeUndefined();
    });

    it('rejects suspended accounts and Google-only accounts', async () => {
      await createVerifiedCustomer();
      await prisma.user.update({
        where: { email: 'ada@skindx.test' },
        data: { status: 'SUSPENDED' },
      });

      const suspended = await api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: STRONG_PASSWORD,
      });
      expect(suspended.status).toBe(403);

      await prisma.user.create({
        data: {
          email: 'google.only@skindx.test',
          passwordHash: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          externalIdentities: {
            create: { provider: 'GOOGLE', providerUserId: 'g-only-1' },
          },
        },
      });

      const googleOnly = await api().post('/api/v1/auth/login').send({
        email: 'google.only@skindx.test',
        password: STRONG_PASSWORD,
      });
      expect(googleOnly.status).toBe(401);
    });

    it('denies customer sessions on admin endpoints', async () => {
      await createVerifiedCustomer();
      const login = await api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: STRONG_PASSWORD,
      });

      const adminDashboard = await api()
        .get('/api/v1/admin/sites/IN/dashboard')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`);

      expect(adminDashboard.status).toBe(403);
    });
  });

  describe('refresh and logout', () => {
    async function loginVerified() {
      await api().post('/api/v1/auth/register').send(registerBody());
      const otp = await latestOtpPlaintext();
      await api().post('/api/v1/auth/verify-email').send({
        email: 'ada@skindx.test',
        otp,
      });
      return api().post('/api/v1/auth/login').send({
        email: 'ada@skindx.test',
        password: STRONG_PASSWORD,
      });
    }

    it('rotates refresh tokens and detects reuse', async () => {
      const login = await loginVerified();
      const cookies = login.headers['set-cookie'] as string[] | undefined;
      expect(cookies?.length).toBeGreaterThan(0);

      const refresh1 = await api()
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies ?? [])
        .send({});
      expect(refresh1.status).toBe(200);
      expect(refresh1.body.data.accessToken).toBeTruthy();

      const nextCookies = refresh1.headers['set-cookie'] as string[] | undefined;

      // Reuse the original rotated cookie → family revoke
      const reuse = await api()
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies ?? [])
        .send({});
      expect(reuse.status).toBe(401);

      const afterReuse = await api()
        .post('/api/v1/auth/refresh')
        .set('Cookie', nextCookies ?? [])
        .send({});
      expect(afterReuse.status).toBe(401);
    });

    it('logout invalidates the refresh session', async () => {
      const login = await loginVerified();
      const cookies = login.headers['set-cookie'] as string[] | undefined;
      expect(cookies?.length).toBeGreaterThan(0);

      const logout = await api().post('/api/v1/auth/logout').set('Cookie', cookies ?? []);
      expect(logout.status).toBe(204);

      const refresh = await api()
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies ?? [])
        .send({});
      expect(refresh.status).toBe(401);
    });

    it('returns /me for authenticated customers and 401 without a session', async () => {
      const login = await loginVerified();
      const me = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`);

      expect(me.status).toBe(200);
      expect(me.body.data.user.role).toBe('CUSTOMER');
      expect(me.body.data.user.hasPassword).toBe(true);
      expect(me.body.data.user.linkedProviders).toEqual([]);
      expect(me.body.data.user.createdAt).toBeTruthy();
      expect(me.body.data.sites).toEqual([]);

      const unauth = await api().get('/api/v1/auth/me');
      expect(unauth.status).toBe(401);
    });
  });

  describe('PATCH /auth/password', () => {
    async function seedAndLogin(email = 'pass.change@skindx.test') {
      await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(STRONG_PASSWORD),
          firstName: 'Ada',
          lastName: 'Lovelace',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });
      return api().post('/api/v1/auth/login').send({
        email,
        password: STRONG_PASSWORD,
      });
    }

    it('changes password when the current password is valid and revokes prior sessions', async () => {
      const login = await seedAndLogin();
      expect(login.status).toBe(200);
      const cookies = login.headers['set-cookie'] as string[] | undefined;
      const newPassword = 'NewStrongPass1!xx';

      const changed = await api()
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .send({
          currentPassword: STRONG_PASSWORD,
          newPassword,
          confirmPassword: newPassword,
        });

      expect(changed.status).toBe(200);
      expect(changed.body.data.accessToken).toBeTruthy();
      expect(changed.body.data.user.hasPassword).toBe(true);

      const oldRefresh = await api()
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies ?? [])
        .send({});
      expect(oldRefresh.status).toBe(401);

      const loginOld = await api().post('/api/v1/auth/login').send({
        email: 'pass.change@skindx.test',
        password: STRONG_PASSWORD,
      });
      expect(loginOld.status).toBe(401);

      const loginNew = await api().post('/api/v1/auth/login').send({
        email: 'pass.change@skindx.test',
        password: newPassword,
      });
      expect(loginNew.status).toBe(200);
    });

    it('rejects wrong current password', async () => {
      const login = await seedAndLogin('pass.wrong@skindx.test');
      expect(login.status).toBe(200);
      const res = await api()
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .send({
          currentPassword: 'WrongPass1!xxxx',
          newPassword: 'NewStrongPass1!xx',
          confirmPassword: 'NewStrongPass1!xx',
        });
      expect(res.status).toBe(401);
    });

    it('allows Google-only accounts to set a password without a current password', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'google.setpass@skindx.test',
          passwordHash: null,
          firstName: 'Gita',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          externalIdentities: {
            create: { provider: 'GOOGLE', providerUserId: 'g-set-pass-1' },
          },
        },
      });

      const { createTokenPair } = await import('@/lib/jwt');
      const { sha256 } = await import('@/lib/crypto');
      const { expiresAtFromDuration } = await import('@/lib/tokenExpiry');
      const { env } = await import('@/config/env');
      const tokens = createTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(tokens.refreshToken),
          expiresAt: expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN),
        },
      });

      const setPassword = await api()
        .patch('/api/v1/auth/password')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({
          newPassword: 'GoogleSetPass1!x',
          confirmPassword: 'GoogleSetPass1!x',
        });

      expect(setPassword.status).toBe(200);
      expect(setPassword.body.data.user.hasPassword).toBe(true);
      expect(setPassword.body.data.user.linkedProviders).toEqual(['GOOGLE']);

      const login = await api().post('/api/v1/auth/login').send({
        email: 'google.setpass@skindx.test',
        password: 'GoogleSetPass1!x',
      });
      expect(login.status).toBe(200);
    });
  });
});
