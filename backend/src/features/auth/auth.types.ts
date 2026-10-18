/**
 * Auth feature types.
 * Domain DTOs and response shapes for customer and admin auth.
 */

import type { SiteCode, SiteRole, TokenPair, UserRole } from '@/types/common';

export type AuthLinkedProvider = 'GOOGLE';

export interface AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  /** True when the account has a password credential (not inferred from imageUrl). */
  hasPassword: boolean;
  /** Linked external identity providers from trusted server records. */
  linkedProviders: AuthLinkedProvider[];
  createdAt: string;
}

/** Customer Google auth response — refresh token is delivered via HttpOnly cookie */
export interface GoogleAuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface AuthSiteDto {
  id: string;
  code: SiteCode;
  name: string;
  role: SiteRole | 'SUPER_ADMIN';
}

export interface AuthTokensDto extends TokenPair {
  user: AuthUserDto;
}

export interface AuthMeDto {
  user: AuthUserDto;
  sites: AuthSiteDto[];
}

/** Registration response — no session until email is verified */
export interface RegisterPendingDto {
  verificationRequired: true;
  email: string;
}

/** Resend verification always returns a generic acknowledgement */
export interface ResendVerificationDto {
  accepted: true;
}

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED' as const;
