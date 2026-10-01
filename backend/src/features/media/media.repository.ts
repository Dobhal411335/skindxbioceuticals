import { prisma } from '@/lib/prisma';

/**
 * Media repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class MediaRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const mediaRepository = new MediaRepository();
