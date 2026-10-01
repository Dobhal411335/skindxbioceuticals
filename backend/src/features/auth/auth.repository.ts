import { prisma } from '@/lib/prisma';

/**
 * Auth repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class AuthRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // findByEmail, createUser, storeRefreshToken, revokeRefreshToken, etc.
}

export const authRepository = new AuthRepository();
