import { prisma } from '@/lib/prisma';
import type {
  CompanyBasicInfoRecord,
  CompanyBasicInfoUpsertData,
} from './company-basic-info.types';

function toRecord(row: {
  id: string;
  siteId: string;
  companyName: string;
  companyDomainName: string;
  contactNumbers: string[];
  whatsappNumber: string;
  mainLogoUrl: string;
  mainLogoPublicId: string;
  footerLogoUrl: string;
  footerLogoPublicId: string;
  mobileUiLogoUrl: string;
  mobileUiLogoPublicId: string;
  emails: string[];
  officeAddresses: string[];
  googleAddress: string;
  googleUrl: string;
  googleLink: string;
  facebookLink: string;
  instagramLink: string;
  youtubeLink: string;
  googleMapLink: string;
  googleTrackingTag: string;
  titleTagForMainLandingPage: string;
  keywords: string[];
  updatedAt: Date;
}): CompanyBasicInfoRecord {
  return { ...row };
}

export class CompanyBasicInfoRepository {
  async findBySiteId(siteId: string): Promise<CompanyBasicInfoRecord | null> {
    const row = await prisma.companyBasicInfo.findUnique({
      where: { siteId },
    });
    return row ? toRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: CompanyBasicInfoUpsertData,
  ): Promise<CompanyBasicInfoRecord> {
    const row = await prisma.companyBasicInfo.upsert({
      where: { siteId },
      create: {
        siteId,
        ...data,
      },
      update: {
        ...data,
      },
    });
    return toRecord(row);
  }
}

export const companyBasicInfoRepository = new CompanyBasicInfoRepository();
