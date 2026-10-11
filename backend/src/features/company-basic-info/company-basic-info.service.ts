import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { companyBasicInfoRepository } from './company-basic-info.repository';
import type {
  CompanyBasicInfoBody,
} from './company-basic-info.validation';
import type {
  CompanyBasicInfoDto,
  CompanyBasicInfoRecord,
  CompanyBasicInfoUpsertData,
  SiteCodeDto,
} from './company-basic-info.types';

function emptyImage() {
  return { url: '', publicId: '' };
}

export function emptyCompanyBasicInfoDto(siteCode: SiteCodeDto): CompanyBasicInfoDto {
  return {
    id: null,
    siteCode,
    companyName: '',
    companyDomainName: '',
    contactNumbers: [],
    whatsappNumber: '',
    mainLogo: emptyImage(),
    footerLogo: emptyImage(),
    mobileUiLogo: emptyImage(),
    emails: [],
    officeAddresses: [],
    googleAddress: '',
    googleUrl: '',
    googleLink: '',
    facebookLink: '',
    instagramLink: '',
    youtubeLink: '',
    googleMapLink: '',
    googleTrackingTag: '',
    titleTagForMainLandingPage: '',
    keywords: [],
    updatedAt: null,
  };
}

export function toCompanyBasicInfoDto(
  record: CompanyBasicInfoRecord,
  siteCode: SiteCodeDto,
): CompanyBasicInfoDto {
  return {
    id: record.id,
    siteCode,
    companyName: record.companyName,
    companyDomainName: record.companyDomainName,
    contactNumbers: record.contactNumbers,
    whatsappNumber: record.whatsappNumber,
    mainLogo: {
      url: record.mainLogoUrl,
      publicId: record.mainLogoPublicId,
    },
    footerLogo: {
      url: record.footerLogoUrl,
      publicId: record.footerLogoPublicId,
    },
    mobileUiLogo: {
      url: record.mobileUiLogoUrl,
      publicId: record.mobileUiLogoPublicId,
    },
    emails: record.emails,
    officeAddresses: record.officeAddresses,
    googleAddress: record.googleAddress,
    googleUrl: record.googleUrl,
    googleLink: record.googleLink,
    facebookLink: record.facebookLink,
    instagramLink: record.instagramLink,
    youtubeLink: record.youtubeLink,
    googleMapLink: record.googleMapLink,
    googleTrackingTag: record.googleTrackingTag,
    titleTagForMainLandingPage: record.titleTagForMainLandingPage,
    keywords: record.keywords,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: CompanyBasicInfoBody): CompanyBasicInfoUpsertData {
  return {
    companyName: body.companyName,
    companyDomainName: body.companyDomainName,
    contactNumbers: body.contactNumbers,
    whatsappNumber: body.whatsappNumber,
    mainLogoUrl: body.mainLogo.url,
    mainLogoPublicId: body.mainLogo.publicId,
    footerLogoUrl: body.footerLogo.url,
    footerLogoPublicId: body.footerLogo.publicId,
    mobileUiLogoUrl: body.mobileUiLogo.url,
    mobileUiLogoPublicId: body.mobileUiLogo.publicId,
    emails: body.emails,
    officeAddresses: body.officeAddresses,
    googleAddress: body.googleAddress,
    googleUrl: body.googleUrl,
    googleLink: body.googleLink,
    facebookLink: body.facebookLink,
    instagramLink: body.instagramLink,
    youtubeLink: body.youtubeLink,
    googleMapLink: body.googleMapLink,
    googleTrackingTag: body.googleTrackingTag,
    titleTagForMainLandingPage: body.titleTagForMainLandingPage,
    keywords: body.keywords,
  };
}

function collectReplacedLogoPublicIds(
  existing: CompanyBasicInfoRecord | null,
  next: CompanyBasicInfoUpsertData,
): string[] {
  if (!existing) {
    return [];
  }

  const pairs: Array<[string, string]> = [
    [existing.mainLogoPublicId, next.mainLogoPublicId],
    [existing.footerLogoPublicId, next.footerLogoPublicId],
    [existing.mobileUiLogoPublicId, next.mobileUiLogoPublicId],
  ];

  const orphaned: string[] = [];
  for (const [previous, current] of pairs) {
    const prev = previous.trim();
    const curr = current.trim();
    if (prev && prev !== curr) {
      orphaned.push(prev);
    }
  }
  return orphaned;
}

export class CompanyBasicInfoService {
  constructor(private readonly repository = companyBasicInfoRepository) {}

  async getForSite(siteId: string, siteCode: SiteCode): Promise<CompanyBasicInfoDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyCompanyBasicInfoDto(siteCode);
    }
    return toCompanyBasicInfoDto(record, siteCode);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CompanyBasicInfoBody;
  }): Promise<CompanyBasicInfoDto> {
    const existing = await this.repository.findBySiteId(input.siteId);
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    const replacedPublicIds = collectReplacedLogoPublicIds(existing, data);
    await Promise.all(
      replacedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );

    logger.info(
      {
        event: 'company_basic_info.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        companyBasicInfoId: record.id,
      },
      'Company basic info upserted',
    );

    return toCompanyBasicInfoDto(record, input.siteCode);
  }
}

export const companyBasicInfoService = new CompanyBasicInfoService();
