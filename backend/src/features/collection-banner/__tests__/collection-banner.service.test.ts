import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import {
  collectOrphanedCollectionPublicIds,
  CollectionBannerService,
  emptyCollectionBannerConfigDto,
  toCollectionBannerConfigDto,
} from '../collection-banner.service';
import type { CollectionBannerRepository } from '../collection-banner.repository';
import type { CollectionBannerConfigRecord } from '../collection-banner.types';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(
  overrides: Partial<CollectionBannerConfigRecord> = {},
): CollectionBannerConfigRecord {
  return {
    id: 'cfg-1',
    siteId: 'site-1',
    sectionLabel: 'Collection',
    sectionHeading: 'Discover The Beauty In Our Gallery',
    updatedAt: new Date('2026-10-13T12:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        imageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/collection.jpg',
        imagePublicId: 'collection/slide-1',
        title: 'Necklaces',
        description: 'Explore our necklace collection.',
        buttonUrl: '/shop/necklaces',
        sortOrder: 0,
        active: true,
      },
      {
        id: 'item-2',
        imageUrl: 'https://cdn.example.com/hidden.jpg',
        imagePublicId: 'collection/hidden',
        title: 'Hidden',
        description: 'Inactive',
        buttonUrl: '/hidden',
        sortOrder: 1,
        active: false,
      },
    ],
    ...overrides,
  };
}

describe('CollectionBannerService', () => {
  const repository = {
    findBySiteId: jest.fn(),
    upsertBySiteId: jest.fn(),
  } as unknown as CollectionBannerRepository;

  const service = new CollectionBannerService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    (repository.findBySiteId as jest.Mock).mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyCollectionBannerConfigDto('IN'));
  });

  it('maps records and prefers https Cloudinary URLs', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(toCollectionBannerConfigDto(record, 'IN'));
    expect(dto.items[0]?.imageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/collection.jpg',
    );
  });

  it('filters inactive items for public reads', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.title).toBe('Necklaces');
  });

  it('upserts and cleans orphaned Cloudinary assets', async () => {
    const previous = makeRecord();
    const nextRecord = makeRecord({
      items: [
        {
          id: 'item-3',
          imageUrl: 'https://cdn.example.com/bracelets.jpg',
          imagePublicId: 'collection/bracelets',
          title: 'Bracelets',
          description: 'Delicate chains.',
          buttonUrl: '/shop/bracelets',
          sortOrder: 0,
          active: true,
        },
      ],
    });
    (repository.findBySiteId as jest.Mock).mockResolvedValue(previous);
    (repository.upsertBySiteId as jest.Mock).mockResolvedValue(nextRecord);

    const dto = await service.upsertForSite({
      siteId: 'site-1',
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        sectionLabel: 'Collection',
        sectionHeading: 'Discover The Beauty In Our Gallery',
        items: [
          {
            imageUrl: 'https://cdn.example.com/bracelets.jpg',
            imagePublicId: 'collection/bracelets',
            title: 'Bracelets',
            description: 'Delicate chains.',
            buttonUrl: '/shop/bracelets',
            active: true,
          },
        ],
      },
    });

    expect(dto.items[0]?.title).toBe('Bracelets');
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'collection/slide-1',
    );
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith(
      'collection/hidden',
    );
  });

  it('collectOrphanedCollectionPublicIds returns removed public ids', () => {
    const previous = makeRecord();
    const orphans = collectOrphanedCollectionPublicIds(previous, {
      sectionLabel: 'Collection',
      sectionHeading: 'Discover',
      items: [
        {
          imageUrl: 'https://cdn.example.com/collection.jpg',
          imagePublicId: 'collection/slide-1',
          title: 'Necklaces',
          description: 'Explore',
          buttonUrl: '/shop',
          sortOrder: 0,
          active: true,
        },
      ],
    });
    expect(orphans).toEqual(['collection/hidden']);
  });
});
