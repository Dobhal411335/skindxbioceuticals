import { prisma } from '@/lib/prisma';

/**
 * Enquiry repository - Prisma data access only.
 * Controllers and services must not call Prisma directly.
 */
export class EnquiryRepository {
  protected readonly db = prisma;

  constructor() {
    void this.db;
  }

  // Data-access methods will be added when implementing this feature.
}

export const enquiryRepository = new EnquiryRepository();
