import { prisma } from '@/lib/prisma';

/**
 * User repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class UserRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const userRepository = new UserRepository();
