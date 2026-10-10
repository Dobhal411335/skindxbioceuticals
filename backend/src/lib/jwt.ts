import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import type { JwtPayload, TokenPair } from '@/types/common';

/**
 * JWT helpers — token creation and verification only.
 * Auth business rules live in features/auth.
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  // Unique jti ensures refresh token hashes never collide within the same second
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

export function createTokenPair(payload: JwtPayload): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
