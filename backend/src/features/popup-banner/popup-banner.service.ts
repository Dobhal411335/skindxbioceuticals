import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { popupBannerRepository } from './popup-banner.repository';
import type { PopupBannerConfigBody } from './popup-banner.validation';
import type {
  PopupBannerConfigDto,
  PopupBannerConfigRecord,
  PopupBannerConfigUpsertData,
  SiteCodeDto,
} from './popup-banner.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function emptyPopupBannerConfigDto(siteCode: SiteCodeDto): PopupBannerConfigDto {
  return {
    id: null,
    siteCode,
    imageUrl: '',
    imagePublicId: '',
    miniHeading: '',
    heading: '',
    subDescription: '',
    buttonLabel: '',
    buttonUrl: '',
    active: false,
    updatedAt: null,
  };
}

export function toPopupBannerConfigDto(
  record: PopupBannerConfigRecord,
  siteCode: SiteCodeDto,
): PopupBannerConfigDto {
  return {
    id: record.id,
    siteCode,
    imageUrl: preferHttpsUrl(record.imageUrl),
    imagePublicId: record.imagePublicId,
    miniHeading: record.miniHeading,
    heading: record.heading,
    subDescription: record.subDescription,
    buttonLabel: record.buttonLabel,
    buttonUrl: record.buttonUrl,
    active: record.active,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: PopupBannerConfigBody): PopupBannerConfigUpsertData {
  return {
    imageUrl: preferHttpsUrl(body.imageUrl || ''),
    imagePublicId: body.imagePublicId || '',
    miniHeading: body.miniHeading || '',
    heading: body.heading || '',
    subDescription: body.subDescription || '',
    buttonLabel: body.buttonLabel || '',
    buttonUrl: body.buttonUrl || '',
    active: body.active,
  };
}

export function collectOrphanedPopupPublicIds(
  previous: PopupBannerConfigRecord | null,
  next: PopupBannerConfigUpsertData,
): string[] {
  if (!previous) return [];
  const prevId = previous.imagePublicId.trim();
  const nextId = next.imagePublicId.trim();
  if (prevId && prevId !== nextId) {
    return [prevId];
  }
  return [];
}

export class PopupBannerService {
  constructor(private readonly repository = popupBannerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<PopupBannerConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyPopupBannerConfigDto(siteCode);
    }

    if (options?.activeOnly && !record.active) {
      return emptyPopupBannerConfigDto(siteCode);
    }

    return toPopupBannerConfigDto(record, siteCode);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: PopupBannerConfigBody;
  }): Promise<PopupBannerConfigDto> {
    const previous = await this.repository.findBySiteId(input.siteId);
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    const orphans = collectOrphanedPopupPublicIds(previous, data);
    await Promise.all(
      orphans.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );

    logger.info(
      {
        event: 'popup_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        popupBannerConfigId: record.id,
        active: record.active,
      },
      'Popup banner config upserted',
    );

    return toPopupBannerConfigDto(record, input.siteCode);
  }
}

export const popupBannerService = new PopupBannerService();
