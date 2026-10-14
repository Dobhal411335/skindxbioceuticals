import type { TokenPayload } from 'google-auth-library';
import { AppError } from '@/utils/AppError';
import { GoogleAuthService } from '../google-auth.service';
import type { UserWithMemberships } from '../auth.repository';

async function expectAppError(promise: Promise<unknown>, statusCode: number): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(statusCode);
  }
}

function expectThrownStatus(fn: () => unknown, statusCode: number): void {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(statusCode);
  }
}

const GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';

function basePayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    iss: 'https://accounts.google.com',
    aud: GOOGLE_CLIENT_ID,
    sub: 'google-sub-123',
    email: 'customer@example.com',
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    name: 'Ada Lovelace',
    given_name: 'Ada',
    family_name: 'Lovelace',
    picture: 'https://example.com/avatar.png',
    ...overrides,
  };
}

function customerUser(overrides: Partial<UserWithMemberships> = {}): UserWithMemberships {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'customer@example.com',
    passwordHash: null,
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    imageUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerifiedAt: new Date(),
    welcomeEmailSentAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    siteMemberships: [],
    externalIdentities: [],
    ...overrides,
  } as UserWithMemberships;
}

describe('GoogleAuthService', () => {
  const verifyIdToken = jest.fn();
  const repository = {
    findByExternalIdentity: jest.fn(),
    findByEmail: jest.fn(),
    findGoogleIdentityByProviderUserId: jest.fn(),
    createGoogleCustomer: jest.fn(),
    linkGoogleIdentityAndActivate: jest.fn(),
    updateLastLogin: jest.fn(),
  };
  const tokens = {
    issueCustomerTokens: jest.fn(),
  };
  const mail = {
    sendWelcomeEmail: jest.fn(),
  };

  let service: GoogleAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GoogleAuthService(
      repository as never,
      tokens as never,
      mail as never,
      { verifyIdToken } as never,
    );
  });

  describe('mapAndValidatePayload / verifyGoogleCredential', () => {
    it('accepts a valid Google ID token payload', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => basePayload(),
      });

      const identity = await service.verifyGoogleCredential('valid-token');
      expect(identity.sub).toBe('google-sub-123');
      expect(identity.email).toBe('customer@example.com');
      expect(identity.emailVerified).toBe(true);
    });

    it('rejects invalid signature / verification failures', async () => {
      verifyIdToken.mockRejectedValue(new Error('invalid signature'));
      await expectAppError(service.verifyGoogleCredential('bad'), 401);
    });

    it('rejects expired tokens', () => {
      expectThrownStatus(
        () =>
          service.mapAndValidatePayload(basePayload({ exp: Math.floor(Date.now() / 1000) - 10 })),
        401,
      );
    });

    it('rejects wrong audience', () => {
      expectThrownStatus(
        () => service.mapAndValidatePayload(basePayload({ aud: 'other-client-id' })),
        401,
      );
    });

    it('rejects wrong issuer', () => {
      expectThrownStatus(
        () => service.mapAndValidatePayload(basePayload({ iss: 'https://evil.example' })),
        401,
      );
    });

    it('rejects missing identity claims', () => {
      expectThrownStatus(
        () => service.mapAndValidatePayload(basePayload({ sub: undefined, email: undefined })),
        422,
      );
    });

    it('rejects unverified email', () => {
      expectThrownStatus(
        () => service.mapAndValidatePayload(basePayload({ email_verified: false })),
        401,
      );
    });
  });

  describe('resolveCustomer', () => {
    const identity = {
      sub: 'google-sub-123',
      email: 'customer@example.com',
      emailVerified: true,
      firstName: 'Ada',
      lastName: 'Lovelace',
    };

    it('returns an existing linked Google identity', async () => {
      const user = customerUser();
      repository.findByExternalIdentity.mockResolvedValue(user);

      await expect(service.resolveCustomer(identity)).resolves.toEqual(user);
      expect(repository.createGoogleCustomer).not.toHaveBeenCalled();
    });

    it('creates a customer on first-time Google signup', async () => {
      const created = customerUser();
      repository.findByExternalIdentity.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(null);
      repository.createGoogleCustomer.mockResolvedValue(created);
      mail.sendWelcomeEmail.mockResolvedValue({ submitted: true });

      await expect(service.resolveCustomer(identity)).resolves.toEqual(created);
      expect(mail.sendWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({ email: created.email }),
          siteCode: 'IN',
        }),
      );
    });

    it('does not fail signup when welcome email fails', async () => {
      const created = customerUser();
      repository.findByExternalIdentity.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(null);
      repository.createGoogleCustomer.mockResolvedValue(created);
      mail.sendWelcomeEmail.mockRejectedValue(new Error('brevo down'));

      await expect(service.resolveCustomer(identity)).resolves.toEqual(created);
    });

    it('links Google to an existing password account when email is verified by Google', async () => {
      const existing = customerUser({
        passwordHash: 'hashed-password',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      });
      const linked = customerUser({
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        externalIdentities: [
          { id: 'ei-1', provider: 'GOOGLE', providerUserId: identity.sub } as never,
        ],
      });
      repository.findByExternalIdentity.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(existing);
      repository.findGoogleIdentityByProviderUserId.mockResolvedValue(null);
      repository.linkGoogleIdentityAndActivate.mockResolvedValue(linked);

      await expect(service.resolveCustomer(identity)).resolves.toEqual(linked);
      expect(repository.createGoogleCustomer).not.toHaveBeenCalled();
      expect(repository.linkGoogleIdentityAndActivate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: existing.id,
          providerUserId: identity.sub,
        }),
      );
    });

    it('rejects suspended accounts', async () => {
      repository.findByExternalIdentity.mockResolvedValue(customerUser({ status: 'SUSPENDED' }));

      await expectAppError(service.resolveCustomer(identity), 403);
    });

    it('never treats a Google login as an admin account', async () => {
      repository.findByExternalIdentity.mockResolvedValue(customerUser({ role: 'ADMIN' }));

      await expectAppError(service.resolveCustomer(identity), 403);
    });
  });

  describe('authenticateWithCredential', () => {
    it('issues application tokens after successful verification', async () => {
      const user = customerUser();
      verifyIdToken.mockResolvedValue({
        getPayload: () => basePayload(),
      });
      repository.findByExternalIdentity.mockResolvedValue(user);
      tokens.issueCustomerTokens.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: user.id, email: user.email, role: user.role },
      });

      const result = await service.authenticateWithCredential('valid-token');
      expect(result.accessToken).toBe('access');
      expect(result.user.role).toBe('CUSTOMER');
      expect(repository.updateLastLogin).toHaveBeenCalledWith(user.id);
    });
  });
});
