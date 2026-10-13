import { prisma } from '@/lib/prisma';
import type {
  PopupBannerConfigRecord,
  PopupBannerConfigUpsertData,
} from './popup-banner.types';

function toRecord(row: {
  id: string;
  siteId: string;
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  subDescription: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  updatedAt: Date;
}): PopupBannerConfigRecord {
  return { ...row };
}

export class PopupBannerRepository {
  async findBySiteId(siteId: string): Promise<PopupBannerConfigRecord | null> {
    const row = await prisma.popupBannerConfig.findUnique({
      where: { siteId },
    });
    return row ? toRecord(row) : null;
  }

  async upsertBySiteId(
    siteId: string,
    data: PopupBannerConfigUpsertData,
  ): Promise<PopupBannerConfigRecord> {
    const row = await prisma.popupBannerConfig.upsert({
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

export const popupBannerRepository = new PopupBannerRepository();
