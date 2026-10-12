import { ConflictError, NotFoundError } from '@/utils/AppError';
import { CouponService, toCouponDto } from '../coupon.service';
import type { CouponRepository } from '../coupon.repository';
import type { CouponRecord } from '../coupon.types';

function makeRecord(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    siteId: '22222222-2222-2222-2222-222222222222',
    code: 'SAVE10',
    type: 'PERCENTAGE',
    value: 10,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2026-12-31T23:59:59.999Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CouponService', () => {
  const listBySiteId = jest.fn();
  const findByIdForSite = jest.fn();
  const findByCodeForSite = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const patch = jest.fn();
  const countProductLinks = jest.fn();
  const deleteFn = jest.fn();

  const repository = {
    listBySiteId,
    findByIdForSite,
    findByCodeForSite,
    create,
    update,
    patch,
    countProductLinks,
    delete: deleteFn,
  } as unknown as CouponRepository;

  const service = new CouponService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists and maps site coupons with amount/percent', async () => {
    const percent = makeRecord();
    const amount = makeRecord({
      id: '33333333-3333-3333-3333-333333333333',
      code: 'FLAT100',
      type: 'FIXED_AMOUNT',
      value: 100,
    });
    listBySiteId.mockResolvedValue([percent, amount]);

    const result = await service.listForSite(percent.siteId, 'IN');

    expect(listBySiteId).toHaveBeenCalledWith(percent.siteId);
    expect(result[0]).toEqual(toCouponDto(percent, 'IN'));
    expect(result[0]?.percent).toBe(10);
    expect(result[0]?.amount).toBeNull();
    expect(result[1]?.amount).toBe(100);
    expect(result[1]?.percent).toBeNull();
  });

  it('creates a percent coupon for the site', async () => {
    const record = makeRecord();
    findByCodeForSite.mockResolvedValue(null);
    create.mockResolvedValue(record);

    const dto = await service.createForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      body: {
        code: 'SAVE10',
        amount: null,
        percent: 10,
        startsAt: '2026-01-01',
        endsAt: '2026-12-31',
        isActive: true,
      },
    });

    expect(create).toHaveBeenCalledWith(record.siteId, {
      code: 'SAVE10',
      type: 'PERCENTAGE',
      value: 10,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.999Z'),
      isActive: true,
    });
    expect(dto.id).toBe(record.id);
  });

  it('rejects duplicate codes on create', async () => {
    findByCodeForSite.mockResolvedValue(makeRecord());

    await expect(
      service.createForSite({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        body: {
          code: 'SAVE10',
          amount: 50,
          percent: null,
          startsAt: '2026-01-01',
          endsAt: '2026-12-31',
          isActive: true,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws NotFoundError when updating a missing coupon', async () => {
    findByIdForSite.mockResolvedValue(null);

    await expect(
      service.updateForSite({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        couponId: '11111111-1111-1111-1111-111111111111',
        body: {
          code: 'SAVE10',
          amount: null,
          percent: 10,
          startsAt: '2026-01-01',
          endsAt: '2026-12-31',
          isActive: true,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('patches active status', async () => {
    const record = makeRecord({ isActive: false });
    patch.mockResolvedValue(record);

    const dto = await service.patchForSite({
      siteId: record.siteId,
      siteCode: 'COM',
      userId: 'user-1',
      couponId: record.id,
      body: { isActive: false },
    });

    expect(patch).toHaveBeenCalledWith(record.siteId, record.id, { isActive: false });
    expect(dto.isActive).toBe(false);
  });

  it('blocks delete when coupon is assigned to products', async () => {
    findByIdForSite.mockResolvedValue(makeRecord());
    countProductLinks.mockResolvedValue(2);

    await expect(
      service.deleteForSite({
        siteId: 'site',
        siteCode: 'IN',
        userId: 'user-1',
        couponId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('deletes when no product links exist', async () => {
    const record = makeRecord();
    findByIdForSite.mockResolvedValue(record);
    countProductLinks.mockResolvedValue(0);
    deleteFn.mockResolvedValue(true);

    await service.deleteForSite({
      siteId: record.siteId,
      siteCode: 'IN',
      userId: 'user-1',
      couponId: record.id,
    });

    expect(deleteFn).toHaveBeenCalledWith(record.siteId, record.id);
  });
});
