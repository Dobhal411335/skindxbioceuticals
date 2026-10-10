import { env } from '@/config/env';
import { secureCompare, sha256 } from '@/lib/crypto';
import { emailService } from '@/lib/email';
import { createTokenPair, verifyRefreshToken } from '@/lib/jwt';
import { comparePassword, hashPassword } from '@/lib/password';
import { expiresAtFromDuration } from '@/lib/tokenExpiry';
import type { SiteCode } from '@/types/common';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import type {
  AdminLoginInput,
  BootstrapAdminInput,
  ChangePasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from './auth.validation';
import { authRepository, type UserWithMemberships } from './auth.repository';
import {
  EMAIL_NOT_VERIFIED_CODE,
  type AuthLinkedProvider,
  type AuthMeDto,
  type AuthSiteDto,
  type AuthTokensDto,
  type AuthUserDto,
  type RegisterPendingDto,
  type ResendVerificationDto,
} from './auth.types';
import {
  displayNameFromParts,
  generateOtpCode,
  hashOtp,
  otpExpiresAt,
  splitName,
} from './otp.utils';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const EMAIL_VERIFICATION_PURPOSE = 'EMAIL_VERIFICATION' as const;
const WELCOME_TEMPLATE_KEY = 'WELCOME';
const OTP_PURPOSE_LABEL = 'email verification';

/**
 * Auth service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 */
export class AuthService {
  constructor(
    private readonly repository = authRepository,
    private readonly mail = emailService,
  ) {}

  async bootstrapAdmin(input: BootstrapAdminInput): Promise<AuthTokensDto> {
    if (!secureCompare(input.bootstrapSecret, env.ADMIN_BOOTSTRAP_SECRET)) {
      throw new UnauthorizedError('Invalid bootstrap secret');
    }

    const existingAdmins = await this.repository.countAdministrators();
    if (existingAdmins > 0) {
      throw new ConflictError('Administrator bootstrap is no longer available');
    }

    const passwordHash = await hashPassword(input.password);

    let user: UserWithMemberships;
    try {
      user = await this.repository.bootstrapSuperAdmin({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_ALREADY_EXISTS') {
        throw new ConflictError('Administrator bootstrap is no longer available');
      }
      if (error instanceof Error && error.message === 'SITES_NOT_SEEDED') {
        throw new ValidationError('Required sites IN and COM are not seeded');
      }
      throw error;
    }

    return this.issueTokens(user);
  }

  async adminLogin(input: AdminLoginInput): Promise<AuthTokensDto> {
    const user = await this.repository.findByEmail(input.email);

    if (!user || !ADMIN_ROLES.has(user.role) || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.repository.updateLastLogin(user.id);
    return this.issueTokens(user);
  }

  async register(input: RegisterInput): Promise<RegisterPendingDto> {
    const email = input.email.toLowerCase();
    const { firstName, lastName } = splitName(input.name);
    const passwordHash = await hashPassword(input.password);

    const existing = await this.repository.findByEmail(email);

    if (existing) {
      if (existing.role !== 'CUSTOMER') {
        throw new ConflictError('An account with this email already exists');
      }

      if (existing.status === 'SUSPENDED' || existing.status === 'INACTIVE') {
        throw new ForbiddenError('Account is not active');
      }

      const hasGoogle = existing.externalIdentities.some((identity) => identity.provider === 'GOOGLE');
      if (hasGoogle && !existing.passwordHash) {
        throw new ConflictError(
          'An account with this email already exists. Sign in with Google instead.',
        );
      }

      if (existing.status === 'ACTIVE' || existing.emailVerifiedAt) {
        throw new ConflictError('An account with this email already exists');
      }

      if (existing.status === 'PENDING_VERIFICATION' && existing.passwordHash) {
        const user = await this.repository.updatePendingPasswordCustomer(existing.id, {
          passwordHash,
          firstName,
          lastName,
        });
        await this.issueAndSendVerificationOtp(user);
        return { verificationRequired: true, email: user.email };
      }

      throw new ConflictError('An account with this email already exists');
    }

    const user = await this.repository.createPendingPasswordCustomer({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    await this.issueAndSendVerificationOtp(user);
    return { verificationRequired: true, email: user.email };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<AuthTokensDto> {
    const email = input.email.toLowerCase();
    const user = await this.repository.findByEmail(email);

    if (
      !user ||
      user.role !== 'CUSTOMER' ||
      !user.passwordHash ||
      user.status === 'SUSPENDED' ||
      user.status === 'INACTIVE'
    ) {
      throw new ValidationError('Invalid or expired verification code');
    }

    if (user.status === 'ACTIVE' && user.emailVerifiedAt) {
      throw new ConflictError('Email is already verified. Please sign in.');
    }

    const token = await this.repository.findLatestActiveVerificationToken(
      user.id,
      EMAIL_VERIFICATION_PURPOSE,
    );

    if (!token || token.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired verification code');
    }

    if (token.attemptCount >= env.OTP_MAX_ATTEMPTS) {
      await this.repository.consumeVerificationToken(token.id);
      throw new ValidationError('Too many invalid attempts. Please request a new code.');
    }

    const otpHash = hashOtp(input.otp);
    if (!secureCompare(otpHash, token.tokenHash)) {
      const attempts = await this.repository.incrementVerificationAttempt(token.id);
      if (attempts >= env.OTP_MAX_ATTEMPTS) {
        await this.repository.consumeVerificationToken(token.id);
        throw new ValidationError('Too many invalid attempts. Please request a new code.');
      }
      throw new ValidationError('Invalid or expired verification code');
    }

    const activated = await this.repository.verifyEmailAndActivate({
      userId: user.id,
      tokenId: token.id,
    });

    if (!activated) {
      throw new ValidationError('Invalid or expired verification code');
    }

    await this.scheduleAndSendWelcomeEmail(activated);

    await this.repository.updateLastLogin(activated.id);
    return this.issueCustomerTokens(activated);
  }

  async resendVerification(input: ResendVerificationInput): Promise<ResendVerificationDto> {
    const email = input.email.toLowerCase();
    const user = await this.repository.findByEmail(email);

    // Always return the same acknowledgement to reduce account enumeration.
    if (
      !user ||
      user.role !== 'CUSTOMER' ||
      !user.passwordHash ||
      user.status !== 'PENDING_VERIFICATION' ||
      user.emailVerifiedAt
    ) {
      return { accepted: true };
    }

    const latest = await this.repository.findLatestActiveVerificationToken(
      user.id,
      EMAIL_VERIFICATION_PURPOSE,
    );

    if (latest) {
      const elapsedMs = Date.now() - latest.createdAt.getTime();
      if (elapsedMs < env.OTP_RESEND_COOLDOWN_SECONDS * 1000) {
        return { accepted: true };
      }
    }

    await this.issueAndSendVerificationOtp(user);
    return { accepted: true };
  }

  async login(input: LoginInput): Promise<AuthTokensDto> {
    const email = input.email.toLowerCase();
    const user = await this.repository.findByEmail(email);

    if (!user || user.role !== 'CUSTOMER' || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'PENDING_VERIFICATION' || !user.emailVerifiedAt) {
      throw new AppError('Email verification required', 403, {
        code: EMAIL_NOT_VERIFIED_CODE,
        email: user.email,
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    await this.repository.updateLastLogin(user.id);
    return this.issueCustomerTokens(user);
  }

  async refresh(input: RefreshTokenInput): Promise<AuthTokensDto> {
    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = sha256(input.refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse of a rotated/revoked refresh token → revoke the entire token family.
    if (stored.revokedAt) {
      await this.repository.revokeAllRefreshTokensForUser(stored.userId);
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (stored.userId !== payload.sub) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (stored.user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not permitted');
    }

    await this.repository.revokeRefreshToken(tokenHash);
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.repository.revokeRefreshToken(sha256(refreshToken));
  }

  async me(userId: string): Promise<AuthMeDto> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    if (ADMIN_ROLES.has(user.role)) {
      return {
        user: this.toUserDto(user),
        sites: await this.resolveAuthorizedSites(user),
      };
    }

    if (user.role !== 'CUSTOMER') {
      throw new UnauthorizedError();
    }

    return {
      user: this.toUserDto(user),
      sites: [],
    };
  }

  /**
   * Changes or sets a customer password.
   * Requires current password when one exists; Google-only accounts may set a password without it.
   * Revokes all refresh sessions and issues a fresh token pair for the current client.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthTokensDto> {
    const user = await this.repository.findById(userId);

    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedError();
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw new ValidationError('Current password is required', {
          fieldErrors: { currentPassword: ['Current password is required'] },
        });
      }

      const passwordValid = await comparePassword(input.currentPassword, user.passwordHash);
      if (!passwordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }
    }

    const passwordHash = await hashPassword(input.newPassword);
    const updated = await this.repository.updatePasswordHash(user.id, passwordHash);
    await this.repository.revokeAllRefreshTokensForUser(user.id);
    return this.issueTokens(updated);
  }

  /**
   * Issues application access/refresh tokens for a verified customer (e.g. Google auth).
   * Public so GoogleAuthService can reuse the same session architecture.
   */
  async issueCustomerTokens(user: UserWithMemberships): Promise<AuthTokensDto> {
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenError('Customer session cannot be issued for this account');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    return this.issueTokens(user);
  }

  private async issueAndSendVerificationOtp(user: UserWithMemberships): Promise<void> {
    await this.repository.invalidateUnconsumedVerificationTokens(
      user.id,
      EMAIL_VERIFICATION_PURPOSE,
    );

    const otpCode = generateOtpCode();
    await this.repository.createVerificationToken({
      userId: user.id,
      tokenHash: hashOtp(otpCode),
      purpose: EMAIL_VERIFICATION_PURPOSE,
      expiresAt: otpExpiresAt(),
    });

    const displayName = displayNameFromParts(user.firstName, user.lastName);

    try {
      await this.mail.sendOtpEmail({
        to: { email: user.email, name: displayName },
        siteCode: 'IN',
        otpCode,
        purpose: OTP_PURPOSE_LABEL,
        expiresInMinutes: env.OTP_EXPIRES_IN_MINUTES,
        displayName,
      });
    } catch {
      // Account + OTP hash already persisted; resend can recover. Never log the OTP.
    }
  }

  private async scheduleAndSendWelcomeEmail(user: UserWithMemberships): Promise<void> {
    if (user.welcomeEmailSentAt) {
      return;
    }

    const displayName = displayNameFromParts(user.firstName, user.lastName);
    const outbox = await this.repository.createEmailOutbox({
      userId: user.id,
      templateKey: WELCOME_TEMPLATE_KEY,
      siteCode: 'IN',
      payloadJson: {
        email: user.email,
        displayName: displayName ?? null,
      },
    });

    try {
      const result = await this.mail.sendWelcomeEmail({
        to: { email: user.email, name: displayName },
        siteCode: 'IN',
        displayName,
      });

      if (result.submitted) {
        await this.repository.markEmailOutboxSent(outbox.id);
        await this.repository.markWelcomeEmailSent(user.id);
      } else {
        await this.repository.markEmailOutboxFailed(
          outbox.id,
          result.errorMessage ?? result.errorCode ?? 'Welcome email not submitted',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Welcome email failed';
      await this.repository.markEmailOutboxFailed(outbox.id, message);
    }
  }

  private async issueTokens(user: UserWithMemberships): Promise<AuthTokensDto> {
    const tokens = createTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.repository.storeRefreshToken({
      userId: user.id,
      tokenHash: sha256(tokens.refreshToken),
      expiresAt: expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      ...tokens,
      user: this.toUserDto(user),
    };
  }

  toUserDto(user: UserWithMemberships): AuthUserDto {
    const linkedProviders = (user.externalIdentities ?? [])
      .map((identity) => identity.provider)
      .filter((provider): provider is AuthLinkedProvider => provider === 'GOOGLE');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      hasPassword: Boolean(user.passwordHash),
      linkedProviders,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async resolveAuthorizedSites(user: UserWithMemberships): Promise<AuthSiteDto[]> {
    if (user.role === 'SUPER_ADMIN') {
      const sites = await this.repository.findActiveSites();
      return sites
        .filter((site) => site.code === 'IN' || site.code === 'COM')
        .map((site) => ({
          id: site.id,
          code: site.code as SiteCode,
          name: site.name,
          role: 'SUPER_ADMIN' as const,
        }));
    }

    return user.siteMemberships
      .filter((membership) => membership.site.isActive)
      .filter((membership) => membership.site.code === 'IN' || membership.site.code === 'COM')
      .map((membership) => ({
        id: membership.site.id,
        code: membership.site.code as SiteCode,
        name: membership.site.name,
        role: membership.role,
      }));
  }
}

export const authService = new AuthService();
