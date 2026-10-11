import {
  emptyFooterConfigDto,
  FooterService,
  toFooterConfigDto,
} from '../footer.service';
import type { FooterRepository } from '../footer.repository';
import type { FooterConfigRecord } from '../footer.types';

function makeRecord(overrides: Partial<FooterConfigRecord> = {}): FooterConfigRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    thankYou: 'Thank you for visiting',
    description: 'Storefront footer description',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    columns: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        footerConfigId: '11111111-1111-1111-1111-111111111111',
        title: 'My account',
        order: 1,
        active: true,
        links: [
          {
            id: '44444444-4444-4444-4444-444444444444',
            columnId: '33333333-3333-3333-3333-333333333333',
            label: 'Sign in',
            url: '/account/login',
            order: 1,
            active: true,
          },
          {
            id: '55555555-5555-5555-5555-555555555555',
            columnId: '33333333-3333-3333-3333-333333333333',
            label: 'Hidden',
            url: '/hidden',
            order: 2,
            active: false,
          },
        ],
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        footerConfigId: '11111111-1111-1111-1111-111111111111',
        title: 'Inactive column',
        order: 2,
        active: false,
        links: [],
      },
    ],
    ...overrides,
  };
}

describe('FooterService', () => {
  const findBySiteId = jest.fn();
  const upsertBySiteId = jest.fn();
  const repository = {
    findBySiteId,
    upsertBySiteId,
  } as unknown as FooterRepository;

  const service = new FooterService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    findBySiteId.mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyFooterConfigDto('IN'));
  });

  it('maps an existing record to DTO with all nested items for admin', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN');
    expect(dto).toEqual(toFooterConfigDto(record, 'IN'));
    expect(dto.columns).toHaveLength(2);
    expect(dto.columns[0]?.links).toHaveLength(2);
  });

  it('filters inactive nested items for public reads', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN', { activeOnly: true });
    expect(dto.columns).toHaveLength(1);
    expect(dto.columns[0]?.title).toBe('My account');
    expect(dto.columns[0]?.links).toHaveLength(1);
    expect(dto.columns[0]?.links[0]?.label).toBe('Sign in');
  });

  it('upserts using siteId from context and ignores client ownership', async () => {
    const record = makeRecord({ thankYou: 'Updated thank you' });
    upsertBySiteId.mockResolvedValue(record);

    const dto = await service.upsertForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      body: {
        thankYou: 'Updated thank you',
        description: 'Storefront footer description',
        columns: [
          {
            title: 'My account',
            active: true,
            order: 1,
            links: [
              {
                label: 'Sign in',
                url: '/account/login',
                active: true,
                order: 1,
              },
            ],
          },
        ],
      },
    });

    expect(upsertBySiteId).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        thankYou: 'Updated thank you',
        description: 'Storefront footer description',
      }),
    );
    expect(dto.siteCode).toBe('COM');
    expect(dto.thankYou).toBe('Updated thank you');
  });
});
