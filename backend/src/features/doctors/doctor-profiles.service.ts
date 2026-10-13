import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { doctorProfilesRepository } from './doctor-profiles.repository';
import type {
  DoctorProfileBody,
  DoctorProfilePatchBody,
} from './doctor-profiles.validation';
import type {
  DoctorProfileDto,
  DoctorProfileRecord,
  DoctorProfileWrite,
  SiteCodeDto,
} from './doctor-profiles.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function toDoctorProfileDto(
  record: DoctorProfileRecord,
  siteCode: SiteCodeDto,
): DoctorProfileDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    specialization: record.specialization,
    about: record.about,
    experienceYears: record.experienceYears,
    consultancyType: record.consultancyType,
    photoUrl: preferHttpsUrl(record.photoUrl),
    photoPublicId: record.photoPublicId,
    active: record.active,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(body: DoctorProfileBody, fallbackOrder: number): DoctorProfileWrite {
  return {
    name: body.name,
    specialization: body.specialization,
    about: body.about,
    experienceYears: body.experienceYears,
    consultancyType: body.consultancyType,
    photoUrl: preferHttpsUrl(body.photoUrl),
    photoPublicId: body.photoPublicId ?? '',
    active: body.active,
    order: body.order ?? fallbackOrder,
  };
}

export class DoctorProfilesService {
  constructor(private readonly repository = doctorProfilesRepository) {}

  async listForSite(siteId: string, siteCode: SiteCode): Promise<DoctorProfileDto[]> {
    const rows = await this.repository.listBySiteId(siteId);
    return rows.map((row) => toDoctorProfileDto(row, siteCode));
  }

  async listActiveForSite(siteId: string, siteCode: SiteCode): Promise<DoctorProfileDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toDoctorProfileDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: DoctorProfileBody;
  }): Promise<DoctorProfileDto> {
    const nextOrder = await this.repository.nextOrder(input.siteId);
    const data = bodyToWrite(input.body, nextOrder);
    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'doctor_profile.created',
        siteCode: input.siteCode,
        userId: input.userId,
        doctorProfileId: record.id,
        consultancyType: record.consultancyType,
      },
      'Doctor profile created',
    );

    return toDoctorProfileDto(record, input.siteCode);
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    doctorId: string;
    body: DoctorProfileBody;
  }): Promise<DoctorProfileDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.doctorId);
    if (!existing) {
      throw new NotFoundError('Doctor profile not found');
    }

    const data = bodyToWrite(input.body, existing.order);
    const record = await this.repository.update(input.siteId, input.doctorId, data);
    if (!record) {
      throw new NotFoundError('Doctor profile not found');
    }

    const previousPublicId = existing.photoPublicId.trim();
    const nextPublicId = data.photoPublicId.trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'doctor_profile.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        doctorProfileId: record.id,
      },
      'Doctor profile updated',
    );

    return toDoctorProfileDto(record, input.siteCode);
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    doctorId: string;
    body: DoctorProfilePatchBody;
  }): Promise<DoctorProfileDto> {
    const record = await this.repository.patch(input.siteId, input.doctorId, input.body);
    if (!record) {
      throw new NotFoundError('Doctor profile not found');
    }

    logger.info(
      {
        event: 'doctor_profile.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        doctorProfileId: record.id,
        active: record.active,
        order: record.order,
      },
      'Doctor profile patched',
    );

    return toDoctorProfileDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    doctorId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.doctorId);
    if (!existing) {
      throw new NotFoundError('Doctor profile not found');
    }

    if (existing.photoPublicId.trim()) {
      await deleteStoredCloudinaryAsset(existing.photoPublicId);
    }

    const deleted = await this.repository.delete(input.siteId, input.doctorId);
    if (!deleted) {
      throw new NotFoundError('Doctor profile not found');
    }

    logger.info(
      {
        event: 'doctor_profile.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        doctorProfileId: input.doctorId,
      },
      'Doctor profile deleted',
    );
  }
}

export const doctorProfilesService = new DoctorProfilesService();
