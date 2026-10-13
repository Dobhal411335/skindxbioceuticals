import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { doctorPageRepository } from './doctor-page.repository';
import type { DoctorPageConfigBody } from './doctor-page.validation';
import type {
  DoctorPageConfigDto,
  DoctorPageConfigRecord,
  DoctorPageConfigUpsertData,
  DoctorServiceItemDto,
  SiteCodeDto,
} from './doctor-page.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function emptyDoctorPageConfigDto(siteCode: SiteCodeDto): DoctorPageConfigDto {
  return {
    id: null,
    siteCode,
    aboutHeading: '',
    aboutDescription: '',
    aboutHighlights: [],
    aboutButtonLabel: '',
    aboutButtonUrl: '',
    aboutImageUrl: '',
    aboutImagePublicId: '',
    aboutSecondaryImageUrl: '',
    aboutSecondaryImagePublicId: '',
    experienceYears: null,
    servicesHeading: '',
    servicesSubheading: '',
    services: [],
    updatedAt: null,
  };
}

function toServiceDto(
  service: DoctorPageConfigRecord['services'][number],
): DoctorServiceItemDto {
  return {
    id: service.id,
    iconKey: service.iconKey,
    name: service.name,
    description: service.description,
    readMoreUrl: service.readMoreUrl,
    order: service.order,
    active: service.active,
  };
}

export function toDoctorPageConfigDto(
  record: DoctorPageConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): DoctorPageConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    id: record.id,
    siteCode,
    aboutHeading: record.aboutHeading,
    aboutDescription: record.aboutDescription,
    aboutHighlights: record.aboutHighlights,
    aboutButtonLabel: record.aboutButtonLabel,
    aboutButtonUrl: record.aboutButtonUrl,
    aboutImageUrl: preferHttpsUrl(record.aboutImageUrl),
    aboutImagePublicId: record.aboutImagePublicId,
    aboutSecondaryImageUrl: preferHttpsUrl(record.aboutSecondaryImageUrl),
    aboutSecondaryImagePublicId: record.aboutSecondaryImagePublicId,
    experienceYears: record.experienceYears,
    servicesHeading: record.servicesHeading,
    servicesSubheading: record.servicesSubheading,
    services: record.services
      .filter((service) => !activeOnly || service.active)
      .map(toServiceDto),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: DoctorPageConfigBody): DoctorPageConfigUpsertData {
  return {
    aboutHeading: body.aboutHeading,
    aboutDescription: body.aboutDescription,
    aboutHighlights: body.aboutHighlights,
    aboutButtonLabel: body.aboutButtonLabel,
    aboutButtonUrl: body.aboutButtonUrl || '',
    aboutImageUrl: preferHttpsUrl(body.aboutImageUrl || ''),
    aboutImagePublicId: body.aboutImagePublicId || '',
    aboutSecondaryImageUrl: preferHttpsUrl(body.aboutSecondaryImageUrl || ''),
    aboutSecondaryImagePublicId: body.aboutSecondaryImagePublicId || '',
    experienceYears:
      body.experienceYears === undefined || body.experienceYears === null
        ? null
        : body.experienceYears,
    servicesHeading: body.servicesHeading,
    servicesSubheading: body.servicesSubheading,
    services: body.services.map((service, index) => ({
      iconKey: service.iconKey,
      name: service.name,
      description: service.description,
      readMoreUrl: service.readMoreUrl || '',
      order: service.order ?? index,
      active: service.active,
    })),
  };
}

function collectPublicIds(record: DoctorPageConfigRecord | null): Set<string> {
  const ids = new Set<string>();
  if (!record) return ids;
  if (record.aboutImagePublicId.trim()) ids.add(record.aboutImagePublicId.trim());
  if (record.aboutSecondaryImagePublicId.trim()) {
    ids.add(record.aboutSecondaryImagePublicId.trim());
  }
  return ids;
}

export class DoctorPageService {
  constructor(private readonly repository = doctorPageRepository) {}

  async getForSite(siteId: string, siteCode: SiteCode): Promise<DoctorPageConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyDoctorPageConfigDto(siteCode);
    }
    return toDoctorPageConfigDto(record, siteCode);
  }

  async getPublicForSite(
    siteId: string,
    siteCode: SiteCode,
  ): Promise<DoctorPageConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyDoctorPageConfigDto(siteCode);
    }
    return toDoctorPageConfigDto(record, siteCode, { activeOnly: true });
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: DoctorPageConfigBody;
  }): Promise<DoctorPageConfigDto> {
    const previous = await this.repository.findBySiteId(input.siteId);
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    const previousIds = collectPublicIds(previous);
    const nextIds = collectPublicIds(record);
    for (const publicId of previousIds) {
      if (!nextIds.has(publicId)) {
        await deleteStoredCloudinaryAssetBestEffort(publicId);
      }
    }

    logger.info(
      {
        event: 'doctor_page.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        doctorPageConfigId: record.id,
        serviceCount: record.services.length,
      },
      'Doctor page config upserted',
    );

    return toDoctorPageConfigDto(record, input.siteCode);
  }
}

export const doctorPageService = new DoctorPageService();
