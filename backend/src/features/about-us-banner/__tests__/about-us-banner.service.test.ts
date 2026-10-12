import { deleteStoredCloudinaryAssetBestEffort } from '@/lib/cloudinary';
import {
  collectOrphanedAboutUsPublicIds,
  emptyAboutUsBannerConfigDto,
  AboutUsBannerService,
  toAboutUsBannerConfigDto,
} from '../about-us-banner.service';
import type { AboutUsBannerRepository } from '../about-us-banner.repository';
import type { AboutUsBannerConfigRecord } from '../about-us-banner.types';

jest.mock('@/lib/cloudinary', () => ({
  deleteStoredCloudinaryAssetBestEffort: jest.fn(),
}));

function makeRecord(
  overrides: Partial<AboutUsBannerConfigRecord> = {},
): AboutUsBannerConfigRecord {
  return {
    id: 'cfg-1',
    siteId: 'site-1',
    promoLabel: 'Featured offers',
    promoHeading: 'Curated selections',
    promoSubheading: 'While stocks last',
    promoButtonLabel: 'Shop now',
    promoButtonUrl: '/shop',
    updatedAt: new Date('2026-10-11T12:00:00.000Z'),
    aboutCards: [
      {
        id: 'card-1',
        imageUrl: 'http://res.cloudinary.com/demo/image/upload/v1/about.jpg',
        imagePublicId: 'about/card',
        label: 'About us',
        heading: 'Science-led care',
        description: 'Clear product presentation.',
        buttonLabel: 'Read more',
        buttonUrl: '/about',
        sortOrder: 0,
        active: true,
      },
      {
        id: 'card-2',
        imageUrl: 'https://cdn.example.com/hidden.jpg',
        imagePublicId: 'about/hidden',
        label: 'Hidden',
        heading: 'Hidden card',
        description: 'Inactive',
        buttonLabel: 'Go',
        buttonUrl: '/hidden',
        sortOrder: 1,
        active: false,
      },
    ],
    highlightItems: [
      {
        id: 'hi-1',
        imageUrl: 'https://cdn.example.com/hi.jpg',
        imagePublicId: 'about/hi',
        heading: 'Ingredients guide',
        buttonLabel: 'Read more',
        buttonUrl: '/blog/reading-ingredients',
        sortOrder: 0,
        active: true,
      },
    ],
    textSlides: [
      {
        id: 'ts-1',
        heading: 'Crafting clarity',
        subheading: 'Educational notes.',
        sortOrder: 0,
        active: true,
      },
    ],
    ...overrides,
  };
}

describe('AboutUsBannerService', () => {
  const repository = {
    findBySiteId: jest.fn(),
    upsertBySiteId: jest.fn(),
  } as unknown as AboutUsBannerRepository;

  const service = new AboutUsBannerService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    (repository.findBySiteId as jest.Mock).mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyAboutUsBannerConfigDto('IN'));
  });

  it('maps records and prefers https Cloudinary URLs', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(toAboutUsBannerConfigDto(record, 'IN'));
    expect(dto.aboutCards[0]?.imageUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/about.jpg',
    );
  });

  it('filters inactive nested items for public reads', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.aboutCards).toHaveLength(1);
    expect(dto.aboutCards[0]?.id).toBe('card-1');
  });

  it('collects orphaned public IDs when cards or highlights are removed', () => {
    const previous = makeRecord();
    const orphans = collectOrphanedAboutUsPublicIds(previous, {
      promoLabel: 'Featured offers',
      promoHeading: 'Curated selections',
      promoSubheading: 'While stocks last',
      promoButtonLabel: 'Shop now',
      promoButtonUrl: '/shop',
      aboutCards: [
        {
          imageUrl: 'https://cdn.example.com/about.jpg',
          imagePublicId: 'about/card',
          label: 'About us',
          heading: 'Science-led care',
          description: 'Clear product presentation.',
          buttonLabel: 'Read more',
          buttonUrl: '/about',
          sortOrder: 0,
          active: true,
        },
      ],
      highlightItems: [],
      textSlides: [],
    });

    expect(orphans.sort()).toEqual(['about/hi', 'about/hidden'].sort());
  });

  it('upserts and deletes orphaned Cloudinary assets', async () => {
    const existing = makeRecord();
    const saved = makeRecord({
      aboutCards: existing.aboutCards.slice(0, 1),
      highlightItems: [],
    });
    (repository.findBySiteId as jest.Mock).mockResolvedValue(existing);
    (repository.upsertBySiteId as jest.Mock).mockResolvedValue(saved);
    (deleteStoredCloudinaryAssetBestEffort as jest.Mock).mockResolvedValue(undefined);

    const dto = await service.upsertForSite({
      siteId: 'site-1',
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        promoLabel: 'Featured offers',
        promoHeading: 'Curated selections',
        promoSubheading: 'While stocks last',
        promoButtonLabel: 'Shop now',
        promoButtonUrl: '/shop',
        aboutCards: [
          {
            imageUrl: 'https://cdn.example.com/about.jpg',
            imagePublicId: 'about/card',
            label: 'About us',
            heading: 'Science-led care',
            description: 'Clear product presentation.',
            buttonLabel: 'Read more',
            buttonUrl: '/about',
            active: true,
          },
        ],
        highlightItems: [],
        textSlides: [],
      },
    });

    expect(repository.upsertBySiteId).toHaveBeenCalled();
    expect(dto.id).toBe('cfg-1');
    expect(dto.aboutCards).toHaveLength(1);
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('about/hidden');
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledWith('about/hi');
    expect(deleteStoredCloudinaryAssetBestEffort).toHaveBeenCalledTimes(2);
  });
});
