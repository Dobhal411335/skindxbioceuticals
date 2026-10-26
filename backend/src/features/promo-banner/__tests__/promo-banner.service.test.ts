import {
  emptyPromoBannerConfigDto,
  PromoBannerService,
  toPromoBannerConfigDto,
} from '../promo-banner.service';
import type { PromoBannerRepository } from '../promo-banner.repository';
import type { PromoBannerConfigRecord } from '../promo-banner.types';

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
        miniHeading: 'Formulation standard',
        heading: 'Everyday skincare essentials',
        description: 'Gentle dermatological daily care.',
        buttonLabel: 'Shop now',
        buttonUrl: '/shop',
        sortOrder: 0,
        active: true,
      },
      {
        id: 'item-2',
        miniHeading: '',
        heading: 'Hidden',
        description: '',
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

  it('maps color-led promo copy', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(toPromoBannerConfigDto(record, 'IN'));
    expect(dto.items[0]?.heading).toBe('Everyday skincare essentials');
    expect(dto.items[0]?.description).toBe('Gentle dermatological daily care.');
  });

  it('filters inactive items for public reads', async () => {
    const record = makeRecord();
    (repository.findBySiteId as jest.Mock).mockResolvedValue(record);
    const dto = await service.getForSite('site-1', 'IN', { activeOnly: true });
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.id).toBe('item-1');
  });

  it('upserts promo copy without media fields', async () => {
    const nextRecord = makeRecord({
      items: [
        {
          id: 'item-3',
          miniHeading: 'Targeted clinical actives',
          heading: 'Discover advanced skin care',
          description: 'Targeted actives with proven biocompatibility.',
          buttonLabel: 'Explore products',
          buttonUrl: '/new',
          sortOrder: 0,
          active: true,
        },
      ],
    });
    (repository.upsertBySiteId as jest.Mock).mockResolvedValue(nextRecord);

    const dto = await service.upsertForSite({
      siteId: 'site-1',
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        items: [
          {
            miniHeading: 'Targeted clinical actives',
            heading: 'Discover advanced skin care',
            description: 'Targeted actives with proven biocompatibility.',
            buttonLabel: 'Explore products',
            buttonUrl: '/new',
            active: true,
          },
        ],
      },
    });

    expect(dto.items).toHaveLength(1);
    expect(repository.upsertBySiteId).toHaveBeenCalledWith(
      'site-1',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            description: 'Targeted actives with proven biocompatibility.',
          }),
        ],
      }),
    );
  });
});
