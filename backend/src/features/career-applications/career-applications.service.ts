import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError } from '@/utils/AppError';
import { careerApplicationRepository } from './career-applications.repository';
import type { CareerApplicationRepository } from './career-applications.repository';
import {
  buildCareerResumeAccessUrl,
  uploadCareerResume,
  type UploadedResume,
} from './career-applications.upload';
import type {
  CareerApplicationDto,
  CareerApplicationRecord,
  CareerResumeAccess,
} from './career-applications.types';
import { assertResumeFile } from './career-applications.validation';
import type {
  CareerApplicationCreateBody,
  CareerApplicationListQuery,
  CareerApplicationPatchBody,
} from './career-applications.validation';

export function fullName(record: Pick<CareerApplicationRecord, 'firstName' | 'middleName' | 'lastName'>): string {
  return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ');
}

export function toCareerApplicationDto(
  record: CareerApplicationRecord,
  siteCode: 'IN' | 'COM',
): CareerApplicationDto {
  return {
    id: record.id,
    siteCode,
    firstName: record.firstName,
    middleName: record.middleName,
    lastName: record.lastName,
    fullName: fullName(record),
    birthMonth: record.birthMonth,
    birthDay: record.birthDay,
    birthYear: record.birthYear,
    streetAddress: record.streetAddress,
    streetAddressLine2: record.streetAddressLine2,
    city: record.city,
    state: record.state,
    postalCode: record.postalCode,
    email: record.email,
    phone: record.phone,
    linkedIn: record.linkedIn,
    positionApplied: record.positionApplied,
    heardAbout: record.heardAbout,
    availableStartDate: record.availableStartDate.toISOString().slice(0, 10),
    resumeFileName: record.resumeFileName,
    resumeMimeType: record.resumeMimeType,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class CareerApplicationService {
  constructor(
    private readonly repository: CareerApplicationRepository = careerApplicationRepository,
    private readonly uploadResume: (
      file: Express.Multer.File,
      siteCode: SiteCode,
    ) => Promise<UploadedResume> = uploadCareerResume,
    private readonly resumeUrl: (publicId: string, mimeType: string) => string = buildCareerResumeAccessUrl,
  ) {}

  async createPublic(input: {
    siteId: string;
    siteCode: SiteCode;
    body: CareerApplicationCreateBody;
    file?: Express.Multer.File;
  }): Promise<CareerApplicationDto | null> {
    if (input.body.companyWebsite.trim().length > 0) {
      logger.info(
        { event: 'career_application.honeypot_rejected', siteCode: input.siteCode },
        'Career application honeypot triggered',
      );
      return null;
    }

    assertResumeFile(input.file);
    const uploaded = await this.uploadResume(input.file, input.siteCode);
    const record = await this.repository.create(input.siteId, {
      firstName: input.body.firstName,
      middleName: input.body.middleName,
      lastName: input.body.lastName,
      birthMonth: input.body.birthMonth,
      birthDay: input.body.birthDay,
      birthYear: input.body.birthYear,
      streetAddress: input.body.streetAddress,
      streetAddressLine2: input.body.streetAddressLine2,
      city: input.body.city,
      state: input.body.state,
      postalCode: input.body.postalCode,
      email: input.body.email,
      phone: input.body.phone,
      linkedIn: input.body.linkedIn,
      positionApplied: input.body.positionApplied,
      heardAbout: input.body.heardAbout,
      availableStartDate: input.body.availableStartDate,
      resumeUrl: uploaded.url,
      resumePublicId: uploaded.publicId,
      resumeFileName: input.file.originalname,
      resumeMimeType: input.file.mimetype,
    });

    logger.info(
      {
        event: 'career_application.created',
        siteCode: input.siteCode,
        applicationId: record.id,
        status: record.status,
      },
      'Career application created',
    );

    return toCareerApplicationDto(record, input.siteCode);
  }

  async listForSite(
    siteId: string,
    siteCode: SiteCode,
    query: CareerApplicationListQuery,
  ): Promise<CareerApplicationDto[]> {
    const rows = await this.repository.listBySiteId(siteId, query);
    return rows.map((row) => toCareerApplicationDto(row, siteCode));
  }

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
  ): Promise<CareerApplicationDto> {
    const row = await this.repository.findByIdForSite(siteId, applicationId);
    if (!row) throw new NotFoundError('Career application not found');
    return toCareerApplicationDto(row, siteCode);
  }

  async patchForSite(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
    body: CareerApplicationPatchBody,
  ): Promise<CareerApplicationDto> {
    const row = await this.repository.updateStatusForSite(siteId, applicationId, body.status);
    if (!row) throw new NotFoundError('Career application not found');
    logger.info(
      {
        event: 'career_application.status_updated',
        siteCode,
        applicationId,
        status: row.status,
      },
      'Career application status updated',
    );
    return toCareerApplicationDto(row, siteCode);
  }

  async resumeAccessForSite(
    siteId: string,
    siteCode: SiteCode,
    applicationId: string,
  ): Promise<CareerResumeAccess> {
    const row = await this.repository.findByIdForSite(siteId, applicationId);
    if (!row) throw new NotFoundError('Career application not found');
    logger.info(
      { siteCode, applicationId },
      'Career application resume access issued',
    );
    return {
      url: this.resumeUrl(row.resumePublicId, row.resumeMimeType),
      fileName: row.resumeFileName,
      mimeType: row.resumeMimeType,
    };
  }
}

export const careerApplicationService = new CareerApplicationService();
