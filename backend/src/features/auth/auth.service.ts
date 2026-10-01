import { authRepository } from './auth.repository';

/**
 * Auth service - business logic layer.
 * Depends on the repository; never touches Express Request/Response.
 *
 * Planned responsibilities:
 * - customer registration / login
 * - admin login
 * - refresh token rotation
 * - password hashing via lib/password
 * - JWT issuance via lib/jwt
 */
export class AuthService {
  constructor(private readonly repository = authRepository) {
    void this.repository;
  }
}

export const authService = new AuthService();
