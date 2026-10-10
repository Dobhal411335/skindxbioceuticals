import { randomInt } from 'crypto';
import { env } from '@/config/env';
import { sha256 } from '@/lib/crypto';

/**
 * Generates a cryptographically random numeric OTP of configured length.
 * Never log or persist the plaintext return value outside the verification send path.
 */
export function generateOtpCode(): string {
  const length = env.OTP_LENGTH;
  const max = 10 ** length;
  const value = randomInt(0, max);
  return value.toString().padStart(length, '0');
}

export function hashOtp(otp: string): string {
  return sha256(otp);
}

export function otpExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + env.OTP_EXPIRES_IN_MINUTES * 60_000);
}

export function splitName(name: string): { firstName: string; lastName?: string } {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed };
  }
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1) || undefined,
  };
}

export function displayNameFromParts(
  firstName?: string | null,
  lastName?: string | null,
): string | undefined {
  const parts = [firstName, lastName].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(' ') : undefined;
}
