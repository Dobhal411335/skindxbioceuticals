import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import {
  collectOrphanedHeroPublicIds,
  emptyHeroBannerConfigDto,
  HeroBannerService,
  toHeroBannerConfigDto,
} from '../hero-banner.service';
import type { HeroBannerRepository } from '../hero-banner.repository';
import type { HeroBannerSlideRecord } from '../hero-banner.types';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecords(): HeroBannerSlideRecord[] {
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      siteId: '22222222-2222-2222-2222-222222222222',
      layoutType: 'FULL_WIDTH',
      order: 0,
      active: true,
      mobileImageUrl: 'http://res.cloudinary.com/demo/mobile.jpg',
      mobileImagePublicId: 'hero/mobile',
      desktopImageUrl: 'https://res.cloudinary.com/demo/desktop.jpg',
      desktopImagePublicId: 'hero/desktop',
      miniHeading: '',
      mainHeading: '',
      description: '',
      buttonLabel: '',
      buttonUrl: '',
      button2Label: '',
      button2Url: '',
      leftImageUrl: '',
      leftImagePublicId: '',
      rightImageUrl: '',
      rightImagePublicId: '',
      gridImages: [],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      siteId: '22222222-2222-2222-2222-222222222222',
      layoutType: 'MULTI_IMAGE',
      order: 1,
      active: false,
      mobileImageUrl: '',
      mobileImagePublicId: '',
      desktopImageUrl: '',
      desktopImagePublicId: '',
      miniHeading: '',
      mainHeading: 'our associate brand',
      description: 'Inactive slide',
      buttonLabel: 'Explore More',
      buttonUrl: '/about',
      button2Label: '',
      button2Url: '',
      leftImageUrl: '',
      leftImagePublicId: '',
      rightImageUrl: '',
      rightImagePublicId: '',
      gridImages: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          slideId: '33333333-3333-3333-3333-333333333333',
          imageUrl: 'https://cdn.example.com/a.jpg',
          imagePublicId: 'hero/a',
          alt: 'Brand A',
          order: 0,
        },
      ],
    },
  ];
}

describe('HeroBannerService', () => {
  const listBySiteId = jest.fn();
  const replaceBySiteId = jest.fn();
  const repository = {
    listBySiteId,
    replaceBySiteId,
  } as unknown as HeroBannerRepository;

  const service = new HeroBannerService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no slides exist', async () => {
    listBySiteId.mockResolvedValue([]);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyHeroBannerConfigDto('IN'));
  });

  it('maps all slides for admin and upgrades Cloudinary http URLs', async () => {
    const records = makeRecords();
    listBySiteId.mockResolvedValue(records);
    const dto = await service.getForSite(records[0]!.siteId, 'IN');
    expect(dto).toEqual(toHeroBannerConfigDto(records, 'IN'));
    expect(dto.slides).toHaveLength(2);
    expect(dto.slides[0]!.mobileImageUrl).toBe(
      'https://res.cloudinary.com/demo/mobile.jpg',
    );
  });

  it('filters inactive slides for public reads', async () => {
    const records = makeRecords();
    listBySiteId.mockResolvedValue(records);
    const dto = await service.getForSite(records[0]!.siteId, 'IN', {
      activeOnly: true,
    });
    expect(dto.slides).toHaveLength(1);
    expect(dto.slides[0]!.layoutType).toBe('FULL_WIDTH');
  });

  it('collects orphaned public IDs when images are removed or replaced', () => {
    const previous = makeRecords();
    const next = [
      {
        layoutType: 'FULL_WIDTH' as const,
        order: 0,
        active: true,
        mobileImageUrl: 'https://cdn.example.com/m.jpg',
        mobileImagePublicId: 'hero/mobile',
        desktopImageUrl: 'https://cdn.example.com/d-new.jpg',
        desktopImagePublicId: 'hero/desktop-new',
        miniHeading: '',
        mainHeading: '',
        description: '',
        buttonLabel: '',
        buttonUrl: '',
        button2Label: '',
        button2Url: '',
        leftImageUrl: '',
        leftImagePublicId: '',
        rightImageUrl: '',
        rightImagePublicId: '',
        gridImages: [],
      },
    ];

    expect(collectOrphanedHeroPublicIds(previous, next).sort()).toEqual(
      ['hero/a', 'hero/desktop'].sort(),
    );
  });

  it('upserts slides and deletes orphaned Cloudinary assets', async () => {
    const existing = makeRecords();
    const saved = existing.slice(0, 1);
    listBySiteId.mockResolvedValue(existing);
    replaceBySiteId.mockResolvedValue(saved);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    const dto = await service.upsertForSite({
      siteId: existing[0]!.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        slides: [
          {
            layoutType: 'FULL_WIDTH',
            order: 0,
            active: true,
            mobileImageUrl: 'https://cdn.example.com/m.jpg',
            mobileImagePublicId: 'hero/mobile',
            desktopImageUrl: 'https://cdn.example.com/d.jpg',
            desktopImagePublicId: 'hero/desktop',
            miniHeading: '',
            mainHeading: '',
            description: '',
            buttonLabel: '',
            buttonUrl: '',
            button2Label: '',
            button2Url: '',
            leftImageUrl: '',
            leftImagePublicId: '',
            rightImageUrl: '',
            rightImagePublicId: '',
            gridImages: [],
          },
        ],
      },
    });

    expect(replaceBySiteId).toHaveBeenCalledTimes(1);
    expect(dto.slides).toHaveLength(1);
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('hero/a');
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledTimes(1);
  });
});
