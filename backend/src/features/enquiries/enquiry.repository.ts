import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  EnquiryListFilters,
  EnquiryRecord,
  EnquiryStatusValue,
  EnquiryWrite,
} from './enquiry.types';

function mapRow(row: EnquiryRecord): EnquiryRecord {
  return row;
}

export class EnquiryRepository {
  protected readonly db = prisma;

  async create(siteId: string, data: EnquiryWrite): Promise<EnquiryRecord> {
    const row = await this.db.enquiry.create({
      data: {
        siteId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        source: data.source,
      },
    });
    return mapRow(row as EnquiryRecord);
  }

  async listBySiteId(
    siteId: string,
    filters: EnquiryListFilters = {},
  ): Promise<EnquiryRecord[]> {
    const name = filters.name?.trim();
    const email = filters.email?.trim();
    const phone = filters.phone?.trim();

    const createdAt =
      filters.from || filters.to
        ? {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          }
        : undefined;

    const where: Prisma.EnquiryWhereInput = {
      siteId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(name
        ? { name: { contains: name, mode: 'insensitive' as const } }
        : {}),
      ...(email
        ? { email: { contains: email, mode: 'insensitive' as const } }
        : {}),
      ...(phone
        ? { phone: { contains: phone, mode: 'insensitive' as const } }
        : {}),
    };

    const rows = await this.db.enquiry.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map((row) => mapRow(row as EnquiryRecord));
  }

  async findByIdForSite(
    siteId: string,
    enquiryId: string,
  ): Promise<EnquiryRecord | null> {
    const row = await this.db.enquiry.findFirst({
      where: { id: enquiryId, siteId },
    });
    return row ? mapRow(row as EnquiryRecord) : null;
  }

  async updateStatusForSite(
    siteId: string,
    enquiryId: string,
    status: EnquiryStatusValue,
  ): Promise<EnquiryRecord | null> {
    const existing = await this.db.enquiry.findFirst({
      where: { id: enquiryId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await this.db.enquiry.update({
      where: { id: enquiryId },
      data: { status },
    });
    return mapRow(row as EnquiryRecord);
  }
}

export const enquiryRepository = new EnquiryRepository();
