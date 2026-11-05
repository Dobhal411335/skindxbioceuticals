import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type { CareerApplicationStatusValue } from './career-applications.constants';
import type { CareerApplicationRecord, CareerApplicationWrite } from './career-applications.types';

export type CareerApplicationListFilters = {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: CareerApplicationStatusValue;
  from?: Date;
  to?: Date;
};

function mapRow(row: CareerApplicationRecord): CareerApplicationRecord {
  return row;
}

/** Date-only filters arrive at UTC midnight. Include the whole selected day. */
function inclusiveEnd(date: Date): Date {
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return date;
}

export class CareerApplicationRepository {
  protected readonly db = prisma;

  async create(siteId: string, data: CareerApplicationWrite): Promise<CareerApplicationRecord> {
    const row = await this.db.careerApplication.create({
      data: {
        siteId,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        birthMonth: data.birthMonth,
        birthDay: data.birthDay,
        birthYear: data.birthYear,
        streetAddress: data.streetAddress,
        streetAddressLine2: data.streetAddressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        email: data.email.toLowerCase(),
        phone: data.phone,
        linkedIn: data.linkedIn,
        positionApplied: data.positionApplied,
        heardAbout: data.heardAbout,
        availableStartDate: data.availableStartDate,
        resumeUrl: data.resumeUrl,
        resumePublicId: data.resumePublicId,
        resumeFileName: data.resumeFileName,
        resumeMimeType: data.resumeMimeType,
      },
    });
    return mapRow(row as CareerApplicationRecord);
  }

  async listBySiteId(
    siteId: string,
    filters: CareerApplicationListFilters = {},
  ): Promise<CareerApplicationRecord[]> {
    const name = filters.name?.trim();
    const email = filters.email?.trim();
    const phone = filters.phone?.trim();
    const createdAt =
      filters.from || filters.to
        ? {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: inclusiveEnd(filters.to) } : {}),
          }
        : undefined;

    const where: Prisma.CareerApplicationWhereInput = {
      siteId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.position ? { positionApplied: filters.position } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(email ? { email: { contains: email, mode: 'insensitive' } } : {}),
      ...(phone ? { phone: { contains: phone, mode: 'insensitive' } } : {}),
      ...(name
        ? {
            OR: [
              { firstName: { contains: name, mode: 'insensitive' } },
              { middleName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.db.careerApplication.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map((row) => mapRow(row as CareerApplicationRecord));
  }

  async findByIdForSite(
    siteId: string,
    applicationId: string,
  ): Promise<CareerApplicationRecord | null> {
    const row = await this.db.careerApplication.findFirst({
      where: { id: applicationId, siteId },
    });
    return row ? mapRow(row as CareerApplicationRecord) : null;
  }

  async updateStatusForSite(
    siteId: string,
    applicationId: string,
    status: CareerApplicationStatusValue,
  ): Promise<CareerApplicationRecord | null> {
    const existing = await this.findByIdForSite(siteId, applicationId);
    if (!existing) return null;
    const row = await this.db.careerApplication.update({
      where: { id: applicationId },
      data: { status },
    });
    return mapRow(row as CareerApplicationRecord);
  }
}

export const careerApplicationRepository = new CareerApplicationRepository();
