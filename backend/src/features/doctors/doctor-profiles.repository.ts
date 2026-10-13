import { prisma } from '@/lib/prisma';
import type { DoctorProfileRecord, DoctorProfileWrite } from './doctor-profiles.types';

function mapRow(row: DoctorProfileRecord): DoctorProfileRecord {
  return row;
}

export class DoctorProfilesRepository {
  async listBySiteId(siteId: string): Promise<DoctorProfileRecord[]> {
    const rows = await prisma.doctorProfile.findMany({
      where: { siteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async listActiveBySiteId(siteId: string): Promise<DoctorProfileRecord[]> {
    const rows = await prisma.doctorProfile.findMany({
      where: { siteId, active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async findByIdForSite(siteId: string, doctorId: string): Promise<DoctorProfileRecord | null> {
    const row = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, siteId },
    });
    return row ? mapRow(row) : null;
  }

  async nextOrder(siteId: string): Promise<number> {
    const last = await prisma.doctorProfile.findFirst({
      where: { siteId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  async create(siteId: string, data: DoctorProfileWrite): Promise<DoctorProfileRecord> {
    const row = await prisma.doctorProfile.create({
      data: { siteId, ...data },
    });
    return mapRow(row);
  }

  async update(
    siteId: string,
    doctorId: string,
    data: DoctorProfileWrite,
  ): Promise<DoctorProfileRecord | null> {
    const existing = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.doctorProfile.update({
      where: { id: doctorId },
      data,
    });
    return mapRow(row);
  }

  async patch(
    siteId: string,
    doctorId: string,
    data: { active?: boolean; order?: number },
  ): Promise<DoctorProfileRecord | null> {
    const existing = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, siteId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.doctorProfile.update({
      where: { id: doctorId },
      data,
    });
    return mapRow(row);
  }

  async delete(siteId: string, doctorId: string): Promise<boolean> {
    const existing = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, siteId },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.doctorProfile.delete({ where: { id: doctorId } });
    return true;
  }
}

export const doctorProfilesRepository = new DoctorProfilesRepository();
