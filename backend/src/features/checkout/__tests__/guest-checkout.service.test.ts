import { GuestCheckoutService } from '../guest-checkout.service';
import { ValidationError } from '@/utils/AppError';

const findByTokenHash = jest.fn();
const update = jest.fn();
const create = jest.fn();
const sendOtpEmail = jest.fn();

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/config/env', () => ({
  env: {
    GUEST_CHECKOUT_SESSION_HOURS: 24,
    GUEST_CONFIRMATION_TOKEN_MINUTES: 60,
    OTP_RESEND_COOLDOWN_SECONDS: 60,
    OTP_EXPIRES_IN_MINUTES: 10,
    OTP_MAX_ATTEMPTS: 5,
    OTP_LENGTH: 6,
  },
}));

jest.mock('@/features/auth/otp.utils', () => ({
  generateOtpCode: () => '123456',
  hashOtp: (otp: string) => `hash:${otp}`,
  otpExpiresAt: () => new Date(Date.now() + 10 * 60 * 1000),
}));

jest.mock('@/lib/crypto', () => ({
  sha256: (value: string) => `sha:${value}`,
  secureCompare: (a: string, b: string) => a === b,
}));

function activeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    tokenHash: 'sha:token',
    email: 'existing@example.com',
    emailVerifiedAt: null,
    otpHash: null,
    otpExpiresAt: null,
    otpAttemptCount: 0,
    otpConsumedAt: null,
    otpLastSentAt: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    orderId: null,
    ...overrides,
  };
}

describe('GuestCheckoutService.sendOtp', () => {
  const repository = {
    create,
    findByTokenHash,
    findById: jest.fn(),
    findByConfirmationTokenHash: jest.fn(),
    update,
  };
  const mail = { sendOtpEmail };
  const service = new GuestCheckoutService(repository as never, mail as never);

  beforeEach(() => {
    findByTokenHash.mockReset();
    update.mockReset();
    create.mockReset();
    sendOtpEmail.mockReset();
    update.mockResolvedValue({});
  });

  it('sends OTP for an email even when that address already exists as a user', async () => {
    findByTokenHash.mockResolvedValue(activeSession());
    sendOtpEmail.mockResolvedValue({ submitted: true, providerMessageId: 'msg-1' });

    const result = await service.sendOtp({ sessionToken: 'token' });

    expect(result).toEqual({ accepted: true });
    expect(sendOtpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: 'existing@example.com' },
        otpCode: '123456',
      }),
    );
    expect(update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ otpHash: 'hash:123456', emailVerifiedAt: null }),
    );
    expect(update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ otpLastSentAt: expect.any(Date) }),
    );
  });

  it('does not stamp cooldown or claim success when Brevo rejects the send', async () => {
    findByTokenHash.mockResolvedValue(activeSession());
    sendOtpEmail.mockResolvedValue({
      submitted: false,
      errorCode: 'invalid_parameter',
      errorMessage: 'Email provider rejected the request',
    });

    await expect(service.sendOtp({ sessionToken: 'token' })).rejects.toBeInstanceOf(
      ValidationError,
    );

    expect(update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ otpHash: null, otpExpiresAt: null }),
    );
    expect(
      update.mock.calls.some(
        ([, data]: [string, Record<string, unknown>]) => data.otpLastSentAt instanceof Date,
      ),
    ).toBe(false);
  });

  it('returns resendAvailableAt without sending during cooldown', async () => {
    const lastSent = new Date();
    findByTokenHash.mockResolvedValue(
      activeSession({
        otpLastSentAt: lastSent,
        otpHash: 'hash:old',
      }),
    );

    const result = await service.sendOtp({ sessionToken: 'token' });

    expect(result.accepted).toBe(true);
    expect(result.resendAvailableAt).toBeDefined();
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });
});
