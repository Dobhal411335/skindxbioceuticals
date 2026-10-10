import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { env } from '@/config/env';
import { emailService } from '@/lib/email';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import { authRepository, type UserWithMemberships } from './auth.repository';
import { authService } from './auth.service';
import type { AuthTokensDto } from './auth.types';

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export type VerifiedGoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

/**
 * Verifies Google ID tokens and maps them to application customer sessions.
 * Does not grant admin roles. Does not silently link to existing password accounts.
 */
export class GoogleAuthService {
  private readonly client: OAuth2Client;

  constructor(
    private readonly repository = authRepository,
    private readonly tokens = authService,
    private readonly mail = emailService,
    oauthClient?: OAuth2Client,
  ) {
    this.client = oauthClient ?? new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  async authenticateWithCredential(credential: string): Promise<AuthTokensDto> {
    const identity = await this.verifyGoogleCredential(credential);
    const user = await this.resolveCustomer(identity);
    await this.repository.updateLastLogin(user.id);
    return this.tokens.issueCustomerTokens(user);
  }

  async verifyGoogleCredential(credential: string): Promise<VerifiedGoogleIdentity> {
    let ticket;
    try {
      ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new UnauthorizedError('Invalid Google credential');
    }

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError('Invalid Google credential');
    }

    return this.mapAndValidatePayload(payload);
  }

  mapAndValidatePayload(payload: TokenPayload): VerifiedGoogleIdentity {
    if (!payload.sub) {
      throw new ValidationError('Google credential is missing required identity claims');
    }

    if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
      throw new UnauthorizedError('Invalid Google credential issuer');
    }

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedError('Invalid Google credential audience');
    }

    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedError('Google credential has expired');
    }

    if (!payload.email) {
      throw new ValidationError('Google credential is missing required identity claims');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedError('Google email is not verified');
    }

    const { firstName, lastName } = splitDisplayName(
      payload.name,
      payload.given_name,
      payload.family_name,
    );

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: true,
      firstName,
      lastName,
      imageUrl: typeof payload.picture === 'string' ? payload.picture : undefined,
    };
  }

  async resolveCustomer(identity: VerifiedGoogleIdentity): Promise<UserWithMemberships> {
    const linked = await this.repository.findByExternalIdentity('GOOGLE', identity.sub);
    if (linked) {
      this.assertCustomerCanAuthenticate(linked);
      return linked;
    }

    const existing = await this.repository.findByEmail(identity.email);
    if (existing) {
      throw new ConflictError(
        'An account with this email already exists. Sign in with your password, then link Google from account settings.',
      );
    }

    try {
      const created = await this.repository.createGoogleCustomer({
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        imageUrl: identity.imageUrl,
        providerUserId: identity.sub,
        emailVerifiedAt: new Date(),
      });

      // Welcome email is best-effort — never roll back a successful signup/session.
      try {
        await this.mail.sendWelcomeEmail({
          to: { email: created.email, name: created.firstName ?? undefined },
          siteCode: 'IN',
          displayName: created.firstName ?? undefined,
        });
      } catch {
        // Intentionally ignored: account + session already established.
      }

      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const racedIdentity = await this.repository.findByExternalIdentity('GOOGLE', identity.sub);
        if (racedIdentity) {
          this.assertCustomerCanAuthenticate(racedIdentity);
          return racedIdentity;
        }

        throw new ConflictError(
          'An account with this email already exists. Sign in with your password, then link Google from account settings.',
        );
      }
      throw error;
    }
  }

  private assertCustomerCanAuthenticate(user: UserWithMemberships): void {
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenError('Google authentication is only available for customer accounts');
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
      throw new ForbiddenError('Account is not active');
    }
  }
}

function splitDisplayName(
  fullName?: string | null,
  givenName?: string | null,
  familyName?: string | null,
): { firstName?: string; lastName?: string } {
  if (givenName || familyName) {
    return {
      firstName: givenName?.trim() || undefined,
      lastName: familyName?.trim() || undefined,
    };
  }

  if (!fullName?.trim()) {
    return {};
  }

  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  return { firstName, lastName };
}

export const googleAuthService = new GoogleAuthService();
