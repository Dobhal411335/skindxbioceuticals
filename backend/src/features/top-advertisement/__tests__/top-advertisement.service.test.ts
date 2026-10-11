import {
  emptyTopAdvertisementConfigDto,
  TopAdvertisementService,
  toTopAdvertisementConfigDto,
} from '../top-advertisement.service';
import type { TopAdvertisementRepository } from '../top-advertisement.repository';
import type { TopAdvertisementConfigRecord } from '../top-advertisement.types';

function makeRecord(
  overrides: Partial<TopAdvertisementConfigRecord> = {},
): TopAdvertisementConfigRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        configId: '11111111-1111-1111-1111-111111111111',
        section: 'ANNOUNCEMENT',
        text: 'Free shipping over ₹999',
        url: '/shop',
        active: true,
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        configId: '11111111-1111-1111-1111-111111111111',
        section: 'ANNOUNCEMENT',
        text: 'Hidden promo',
        url: '',
        active: false,
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        configId: '11111111-1111-1111-1111-111111111111',
        section: 'UTILITY',
        text: 'India storefront · Prices in INR',
        url: '',
        active: true,
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        configId: '11111111-1111-1111-1111-111111111111',
        section: 'BENEFIT',
        text: 'Free shipping',
        url: '/policies/shipping',
        active: true,
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        configId: '11111111-1111-1111-1111-111111111111',
        section: 'BENEFIT',
        text: 'Inactive benefit',
        url: '',
        active: false,
      },
    ],
    ...overrides,
  };
}

describe('TopAdvertisementService', () => {
  const findBySiteId = jest.fn();
  const upsertBySiteId = jest.fn();
  const repository = {
    findBySiteId,
    upsertBySiteId,
  } as unknown as TopAdvertisementRepository;

  const service = new TopAdvertisementService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty defaults when no record exists', async () => {
    findBySiteId.mockResolvedValue(null);
    const dto = await service.getForSite('site-1', 'IN');
    expect(dto).toEqual(emptyTopAdvertisementConfigDto('IN'));
  });

  it('maps an existing record to DTO with all items for admin', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN');
    expect(dto).toEqual(toTopAdvertisementConfigDto(record, 'IN'));
    expect(dto.announcements).toHaveLength(2);
    expect(dto.utilityItems).toHaveLength(1);
    expect(dto.benefits).toHaveLength(2);
  });

  it('filters inactive items for public reads', async () => {
    const record = makeRecord();
    findBySiteId.mockResolvedValue(record);
    const dto = await service.getForSite(record.siteId, 'IN', {
      activeOnly: true,
    });
    expect(dto.announcements).toHaveLength(1);
    expect(dto.announcements[0]?.text).toBe('Free shipping over ₹999');
    expect(dto.utilityItems).toHaveLength(1);
    expect(dto.benefits).toHaveLength(1);
    expect(dto.benefits[0]?.text).toBe('Free shipping');
  });

  it('upserts using siteId from context and ignores client ownership', async () => {
    const record = makeRecord();
    upsertBySiteId.mockResolvedValue(record);

    const dto = await service.upsertForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      body: {
        announcements: [
          {
            text: 'Free shipping over ₹999',
            url: '/shop',
            active: true,
          },
        ],
        utilityItems: [
          {
            text: 'India storefront · Prices in INR',
            url: '',
            active: true,
          },
        ],
        benefits: [
          {
            text: 'Free shipping',
            url: '/policies/shipping',
            active: true,
          },
        ],
      },
    });

    expect(upsertBySiteId).toHaveBeenCalledWith(
      record.siteId,
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            section: 'ANNOUNCEMENT',
            text: 'Free shipping over ₹999',
          }),
          expect.objectContaining({
            section: 'UTILITY',
            text: 'India storefront · Prices in INR',
          }),
          expect.objectContaining({
            section: 'BENEFIT',
            text: 'Free shipping',
          }),
        ]),
      }),
    );
    expect(dto.siteCode).toBe('COM');
    expect(dto.id).toBe(record.id);
  });
});
