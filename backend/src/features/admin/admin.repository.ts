import { prisma } from '@/lib/prisma';

/**
 * Admin repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class AdminRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const adminRepository = new AdminRepository();
