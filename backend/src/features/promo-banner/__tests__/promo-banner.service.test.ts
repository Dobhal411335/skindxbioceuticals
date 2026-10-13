import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import {
  collectOrphanedPromoPublicIds,
  emptyPromoBannerConfigDto,
  PromoBannerService,
  toPromoBannerConfigDto,
} from '../promo-banner.service';
import type { PromoBannerRepository } from '../promo-banner.repository';
import type { PromoBannerConfigRecord } from '../promo-banner.types';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(
  overrides: Partial<PromoBannerConfigRecord> = {},
): PromoBannerConfigRecord {
  return {
    id: 'cfg-1',
    siteId: 'site-1',
    updatedAt: new Date('2026-10-13T12:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        imageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/promo.jpg',
        imagePublicId: 'promo/tile-1',
        miniHeading: 'New',
        heading: 'Barrier essentials',
        buttonLabel: 'Shop now',
        buttonUrl: '/shop',
        sortOrder: 0,
        active: true,
      },
      {
        id: 'item-2',
        imageUrl: 'https://cdn.example.com/hidden.jpg',
        imagePublicId: 'promo/hidden',
        miniHeading: '',
        heading: 'Hidden',
        buttonLabel: '',
        buttonUrl: '/hidden',
        sortOrder: 1,
        active: false,
      },
    ],
    ...overrides,
  };
}

describe('PromoBannerService', () => {
  const repository = {
    findBySiteId: jest.fn(),
    upsertBySiteId: jest.fn(),
  } as unknown as PromoBannerRepository;

  const service = new PromoBannerService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    (repository.findBySiteId as jest.Mock).mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyPromoBannerConfigDto('IN'));
  });

  it('maps records and prefers https Cloudinary URLs', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(toPromoBannerConfigDto(record, 'IN'));
    expect(dto.items[0]?.imageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/promo.jpg',
    );
    expect(dto.items[0]?.miniHeading).toBe('New');
    expect(dto.items[0]?.heading).toBe('Barrier essentials');
    expect(dto.items[0]?.buttonLabel).toBe('Shop now');
  });

  it('filters inactive items for public reads', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.id).toBe('item-1');
  });

  it('upserts and cleans orphaned Cloudinary assets', async () => {
    const previous = makeRecord();
    const nextRecord = makeRecord({
      items: [
        {
          id: 'item-3',
          imageUrl: 'https://cdn.example.com/new.jpg',
          imagePublicId: 'promo/new',
          miniHeading: 'Fresh',
          heading: 'New drop',
          buttonLabel: 'Explore',
          buttonUrl: '/new',
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
        items: [
          {
            imageUrl: 'https://cdn.example.com/new.jpg',
            imagePublicId: 'promo/new',
            miniHeading: 'Fresh',
            heading: 'New drop',
            buttonLabel: 'Explore',
            buttonUrl: '/new',
            active: true,
          },
        ],
      },
    });

    expect(dto.items).toHaveLength(1);
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('promo/tile-1');
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('promo/hidden');
  });

  it('collectOrphanedPromoPublicIds returns removed public ids', () => {
    const previous = makeRecord();
    const orphans = collectOrphanedPromoPublicIds(previous, {
      items: [
        {
          imageUrl: 'https://cdn.example.com/new.jpg',
          imagePublicId: 'promo/tile-1',
          miniHeading: '',
          heading: '',
          buttonLabel: '',
          buttonUrl: '/shop',
          sortOrder: 0,
          active: true,
        },
      ],
    });
    expect(orphans).toEqual(['promo/hidden']);
  });
});
