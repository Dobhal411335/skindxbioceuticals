import { randomBytes } from 'crypto';
import { env } from '@/config/env';
import { generateOtpCode, hashOtp, otpExpiresAt } from '@/features/auth/otp.utils';
import { secureCompare, sha256 } from '@/lib/crypto';
import { emailService } from '@/lib/email';
import { logger } from '@/lib/logger';
import { ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { guestCheckoutRepository } from './guest-checkout.repository';
import type {
  GuestSendOtpBody,
  GuestSessionBody,
  GuestVerifyOtpBody,
} from './guest-checkout.validation';

const GUEST_OTP_PURPOSE_LABEL = 'guest checkout email verification';

export class GuestCheckoutService {
  constructor(
    private readonly repository = guestCheckoutRepository,
    private readonly mail = emailService,
  ) {}

  async startSession(input: GuestSessionBody): Promise<{
    sessionToken: string;
    email: string;
    expiresAt: string;
  }> {
    const sessionToken = randomBytes(32).toString('base64url');
    const tokenHash = sha256(sessionToken);
    const expiresAt = new Date(
      Date.now() + env.GUEST_CHECKOUT_SESSION_HOURS * 60 * 60 * 1000,
    );

    const session = await this.repository.create({
      tokenHash,
      email: input.email,
      expiresAt,
    });

    logger.info(
      { event: 'checkout.guest.session.created', context: 'CHECKOUT', sessionId: session.id },
      'Guest checkout session created',
    );

    return {
      sessionToken,
      email: session.email,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async sendOtp(input: GuestSendOtpBody): Promise<{ accepted: true; resendAvailableAt?: string }> {
    const session = await this.requireActiveSession(input.sessionToken);

    if (session.otpLastSentAt) {
      const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
      const elapsed = Date.now() - session.otpLastSentAt.getTime();
      if (elapsed < cooldownMs) {
        const resendAvailableAt = new Date(
          session.otpLastSentAt.getTime() + cooldownMs,
        ).toISOString();
        return { accepted: true, resendAvailableAt };
      }
    }

    const otp = generateOtpCode();
    await this.repository.update(session.id, {
      otpHash: hashOtp(otp),
      otpExpiresAt: otpExpiresAt(),
      otpAttemptCount: 0,
      otpConsumedAt: null,
      otpLastSentAt: new Date(),
      // Changing email verification requires re-verify if somehow email changed — session email is fixed at create.
      emailVerifiedAt: null,
    });

    try {
      await this.mail.sendOtpEmail({
        to: { email: session.email },
        siteCode: 'IN',
        otpCode: otp,
        purpose: GUEST_OTP_PURPOSE_LABEL,
        expiresInMinutes: env.OTP_EXPIRES_IN_MINUTES,
      });
    } catch (error) {
      logger.error(
        {
          event: 'checkout.guest.otp.send_failed',
          context: 'CHECKOUT',
          sessionId: session.id,
          err: error instanceof Error ? error.message : 'unknown',
        },
        'Guest OTP email failed',
      );
      throw new ValidationError('Unable to send verification code. Please try again.');
    }

    logger.info(
      { event: 'checkout.guest.otp.sent', context: 'CHECKOUT', sessionId: session.id },
      'Guest checkout OTP sent',
    );

    return { accepted: true };
  }

  async verifyOtp(input: GuestVerifyOtpBody): Promise<{
    email: string;
    emailVerified: true;
    verifiedAt: string;
  }> {
    const session = await this.requireActiveSession(input.sessionToken);

    if (!session.otpHash || !session.otpExpiresAt) {
      throw new ValidationError('Invalid or expired verification code');
    }

    if (session.otpConsumedAt || session.otpExpiresAt < new Date()) {
      throw new ValidationError('Invalid or expired verification code');
    }

    if (session.otpAttemptCount >= env.OTP_MAX_ATTEMPTS) {
      throw new ValidationError('Too many invalid attempts. Please request a new code.');
    }

    if (!secureCompare(hashOtp(input.otp), session.otpHash)) {
      const nextCount = session.otpAttemptCount + 1;
      await this.repository.update(session.id, {
        otpAttemptCount: nextCount,
        ...(nextCount >= env.OTP_MAX_ATTEMPTS ? { otpConsumedAt: new Date() } : {}),
      });
      if (nextCount >= env.OTP_MAX_ATTEMPTS) {
        throw new ValidationError('Too many invalid attempts. Please request a new code.');
      }
      throw new ValidationError('Invalid or expired verification code');
    }

    const verifiedAt = new Date();
    await this.repository.update(session.id, {
      emailVerifiedAt: verifiedAt,
      otpConsumedAt: verifiedAt,
      otpHash: null,
    });

    logger.info(
      { event: 'checkout.guest.otp.verified', context: 'CHECKOUT', sessionId: session.id },
      'Guest checkout email verified',
    );

    return {
      email: session.email,
      emailVerified: true,
      verifiedAt: verifiedAt.toISOString(),
    };
  }

  async requireVerifiedSession(sessionToken: string) {
    const session = await this.requireActiveSession(sessionToken);
    if (!session.emailVerifiedAt) {
      throw new ForbiddenError('Guest email must be verified before payment');
    }
    return session;
  }

  async requireActiveSession(sessionToken: string) {
    const tokenHash = sha256(sessionToken);
    const session = await this.repository.findByTokenHash(tokenHash);
    if (!session) {
      throw new UnauthorizedError('Invalid guest checkout session');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedError('Guest checkout session expired');
    }
    return session;
  }

  async issueConfirmationToken(sessionId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + env.GUEST_CONFIRMATION_TOKEN_MINUTES * 60 * 1000,
    );
    await this.repository.update(sessionId, {
      confirmationTokenHash: sha256(token),
      confirmationTokenExpiresAt: expiresAt,
    });
    return token;
  }

  async resolveConfirmationToken(token: string) {
    const session = await this.repository.findByConfirmationTokenHash(sha256(token));
    if (
      !session ||
      !session.confirmationTokenExpiresAt ||
      session.confirmationTokenExpiresAt < new Date() ||
      !session.orderId
    ) {
      throw new UnauthorizedError('Invalid or expired confirmation access');
    }
    return session;
  }

  async attachOrder(sessionId: string, orderId: string): Promise<void> {
    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new ConflictError('Guest session not found');
    }
    if (session.orderId && session.orderId !== orderId) {
      throw new ConflictError('Guest session already linked to another order');
    }
    await this.repository.update(sessionId, {
      order: { connect: { id: orderId } },
    });
  }
}

export const guestCheckoutService = new GuestCheckoutService();
