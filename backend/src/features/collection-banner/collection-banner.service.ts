import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { collectionBannerRepository } from './collection-banner.repository';
import type { CollectionBannerConfigBody } from './collection-banner.validation';
import type {
  CollectionBannerConfigDto,
  CollectionBannerConfigRecord,
  CollectionBannerConfigUpsertData,
  CollectionBannerItemDto,
  SiteCodeDto,
} from './collection-banner.types';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function emptyCollectionBannerConfigDto(siteCode: SiteCodeDto): CollectionBannerConfigDto {
  return {
    id: null,
    siteCode,
    sectionLabel: '',
    sectionHeading: '',
    items: [],
    updatedAt: null,
  };
}

function toItemDto(item: CollectionBannerConfigRecord['items'][number]): CollectionBannerItemDto {
  return {
    id: item.id,
    imageUrl: preferHttpsUrl(item.imageUrl),
    imagePublicId: item.imagePublicId,
    title: item.title,
    description: item.description,
    buttonUrl: item.buttonUrl,
    button1Label: item.button1Label ?? '',
    button1Url: item.button1Url ?? '',
    button2Label: item.button2Label ?? '',
    button2Url: item.button2Url ?? '',
    sortOrder: item.sortOrder,
    active: item.active,
  };
}

export function toCollectionBannerConfigDto(
  record: CollectionBannerConfigRecord,
  siteCode: SiteCodeDto,
  options?: { activeOnly?: boolean },
): CollectionBannerConfigDto {
  const activeOnly = options?.activeOnly ?? false;

  return {
    id: record.id,
    siteCode,
    sectionLabel: record.sectionLabel,
    sectionHeading: record.sectionHeading,
    items: record.items.filter((item) => !activeOnly || item.active).map(toItemDto),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToUpsertData(body: CollectionBannerConfigBody): CollectionBannerConfigUpsertData {
  return {
    sectionLabel: body.sectionLabel || '',
    sectionHeading: body.sectionHeading || '',
    items: body.items.map((item, index) => ({
      imageUrl: preferHttpsUrl(item.imageUrl || ''),
      imagePublicId: item.imagePublicId || '',
      title: item.title,
      description: item.description || '',
      buttonUrl: item.buttonUrl || '',
      button1Label: item.button1Label || '',
      button1Url: item.button1Url || '',
      button2Label: item.button2Label || '',
      button2Url: item.button2Url || '',
      sortOrder: item.sortOrder ?? index,
      active: item.active,
    })),
  };
}

function collectPublicIds(
  source:
    Pick<CollectionBannerConfigRecord, 'items'> | Pick<CollectionBannerConfigUpsertData, 'items'>,
): string[] {
  const ids: string[] = [];
  for (const item of source.items) {
    const trimmed = item.imagePublicId.trim();
    if (trimmed) ids.push(trimmed);
  }
  return ids;
}

export function collectOrphanedCollectionPublicIds(
  previous: CollectionBannerConfigRecord | null,
  next: CollectionBannerConfigUpsertData,
): string[] {
  if (!previous) return [];

  const retained = new Set(collectPublicIds(next));
  const orphans = new Set<string>();
  for (const publicId of collectPublicIds(previous)) {
    if (!retained.has(publicId)) {
      orphans.add(publicId);
    }
  }
  return [...orphans];
}

export class CollectionBannerService {
  constructor(private readonly repository = collectionBannerRepository) {}

  async getForSite(
    siteId: string,
    siteCode: SiteCode,
    options?: { activeOnly?: boolean },
  ): Promise<CollectionBannerConfigDto> {
    const record = await this.repository.findBySiteId(siteId);
    if (!record) {
      return emptyCollectionBannerConfigDto(siteCode);
    }
    return toCollectionBannerConfigDto(record, siteCode, options);
  }

  async upsertForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CollectionBannerConfigBody;
  }): Promise<CollectionBannerConfigDto> {
    const existing = await this.repository.findBySiteId(input.siteId);
    const data = bodyToUpsertData(input.body);
    const record = await this.repository.upsertBySiteId(input.siteId, data);

    const orphanedPublicIds = collectOrphanedCollectionPublicIds(existing, data);
    await Promise.all(
      orphanedPublicIds.map((publicId) => deleteStoredCloudinaryAssetBestEffort(publicId)),
    );

    logger.info(
      {
        event: 'collection_banner_config.upserted',
        siteCode: input.siteCode,
        userId: input.userId,
        collectionBannerConfigId: record.id,
        itemCount: record.items.length,
        orphanedImageCount: orphanedPublicIds.length,
      },
      'Collection banner config upserted',
    );

    return toCollectionBannerConfigDto(record, input.siteCode);
  }
}

export const collectionBannerService = new CollectionBannerService();
