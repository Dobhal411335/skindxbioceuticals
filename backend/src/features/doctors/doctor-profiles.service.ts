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
  DoctorProfileFacetsDto,
  DoctorProfilePublicDto,
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

function compareLocale(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))].sort(
    compareLocale,
  );
}

export function toDoctorProfileDto(
  record: DoctorProfileRecord,
  siteCode: SiteCodeDto,
): DoctorProfileDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    specializations: record.specializations,
    about: record.about,
    experienceYears: record.experienceYears,
    state: record.state,
    city: record.city,
    phone: record.phone,
    email: record.email,
    location: record.location,
    education: record.education,
    degree: record.degree,
    workHistory: record.workHistory,
    workDays: record.workDays,
    photoUrl: preferHttpsUrl(record.photoUrl),
    photoPublicId: record.photoPublicId,
    active: record.active,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toDoctorProfilePublicDto(
  record: DoctorProfileRecord,
  siteCode: SiteCodeDto,
): DoctorProfilePublicDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    specializations: record.specializations,
    about: record.about,
    experienceYears: record.experienceYears,
    state: record.state,
    city: record.city,
    phone: record.phone,
    email: record.email,
    location: record.location,
    education: record.education,
    degree: record.degree,
    workHistory: record.workHistory,
    workDays: record.workDays,
    photoUrl: preferHttpsUrl(record.photoUrl),
    active: record.active,
    order: record.order,
  };
}

export function buildDoctorProfileFacets(
  rows: Array<{ specializations: string[]; state: string; city: string }>,
): DoctorProfileFacetsDto {
  const citiesByState: Record<string, Set<string>> = {};

  for (const row of rows) {
    const state = row.state.trim();
    const city = row.city.trim();
    if (!state || !city) continue;
    if (!citiesByState[state]) {
      citiesByState[state] = new Set();
    }
    citiesByState[state].add(city);
  }

  const states = uniqueSorted(Object.keys(citiesByState));
  return {
    specialities: uniqueSorted(rows.flatMap((row) => row.specializations)),
    states,
    citiesByState: Object.fromEntries(
      states.map((state) => [state, uniqueSorted(citiesByState[state] ?? [])]),
    ),
  };
}

function bodyToWrite(body: DoctorProfileBody, fallbackOrder: number): DoctorProfileWrite {
  return {
    name: body.name,
    specializations: body.specializations,
    about: body.about,
    experienceYears: body.experienceYears,
    state: body.state,
    city: body.city,
    phone: body.phone,
    email: body.email,
    location: body.location,
    education: body.education,
    degree: body.degree,
    workHistory: body.workHistory,
    workDays: body.workDays,
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

  async listActiveForSite(
    siteId: string,
    siteCode: SiteCode,
  ): Promise<DoctorProfilePublicDto[]> {
    const rows = await this.repository.listActiveBySiteId(siteId);
    return rows.map((row) => toDoctorProfilePublicDto(row, siteCode));
  }

  async getPublicFacets(siteId: string): Promise<DoctorProfileFacetsDto> {
    const rows = await this.repository.listActiveFilterValues(siteId);
    return buildDoctorProfileFacets(rows);
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
        state: record.state,
        city: record.city,
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
