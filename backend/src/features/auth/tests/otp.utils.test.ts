import { env } from '@/config/env';
import { sha256 } from '@/lib/crypto';
import {
  displayNameFromParts,
  generateOtpCode,
  hashOtp,
  otpExpiresAt,
  splitName,
} from '../otp.utils';

describe('otp.utils', () => {
  it('generates a numeric OTP of the configured length', () => {
    const otp = generateOtpCode();
    expect(otp).toMatch(new RegExp(`^\\d{${env.OTP_LENGTH}}$`));
  });

  it('hashes OTPs with sha256 and never returns plaintext equality', () => {
    const otp = '123456';
    expect(hashOtp(otp)).toBe(sha256(otp));
    expect(hashOtp(otp)).not.toBe(otp);
  });

  it('computes expiry from OTP_EXPIRES_IN_MINUTES', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const expires = otpExpiresAt(from);
    expect(expires.getTime() - from.getTime()).toBe(env.OTP_EXPIRES_IN_MINUTES * 60_000);
  });

  it('splits full names into first and last parts', () => {
    expect(splitName('Ada Lovelace')).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(splitName('Madonna')).toEqual({ firstName: 'Madonna' });
    expect(displayNameFromParts('Ada', 'Lovelace')).toBe('Ada Lovelace');
  });
});
