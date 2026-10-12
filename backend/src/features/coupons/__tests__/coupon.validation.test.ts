import {
  couponBodySchema,
  couponPatchSchema,
  normalizeCouponInput,
} from '../coupon.validation';

describe('coupon validation', () => {
  it('accepts amount-only coupon body', () => {
    const result = couponBodySchema.safeParse({
      code: 'flat50',
      amount: 50,
      percent: null,
      startsAt: '2026-01-01',
      endsAt: '2026-06-30',
      isActive: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('FLAT50');
      expect(result.data.amount).toBe(50);
      expect(result.data.percent).toBeNull();
    }
  });

  it('accepts percent-only coupon body', () => {
    const result = couponBodySchema.safeParse({
      code: 'SAVE10',
      amount: null,
      percent: 10,
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
    });

    expect(result.success).toBe(true);
  });

  it('rejects both amount and percent', () => {
    const result = couponBodySchema.safeParse({
      code: 'BOTH',
      amount: 50,
      percent: 10,
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
    });

    expect(result.success).toBe(false);
  });

  it('rejects neither amount nor percent', () => {
    const result = couponBodySchema.safeParse({
      code: 'NONE',
      amount: null,
      percent: null,
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
    });

    expect(result.success).toBe(false);
  });

  it('rejects end date before start date', () => {
    const result = couponBodySchema.safeParse({
      code: 'RANGE',
      amount: 10,
      percent: null,
      startsAt: '2026-06-01',
      endsAt: '2026-01-01',
    });

    expect(result.success).toBe(false);
  });

  it('rejects percent over 100', () => {
    const result = couponBodySchema.safeParse({
      code: 'OVER',
      amount: null,
      percent: 150,
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
    });

    expect(result.success).toBe(false);
  });

  it('normalizes empty discount fields to null', () => {
    const normalized = normalizeCouponInput({
      code: ' save10 ',
      amount: '',
      percent: '10',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-12-31',
    });

    expect(normalized).toMatchObject({
      code: 'save10',
      amount: null,
      percent: '10',
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
    });
  });

  it('requires isActive on patch', () => {
    expect(couponPatchSchema.safeParse({}).success).toBe(false);
    expect(couponPatchSchema.safeParse({ isActive: true }).success).toBe(true);
  });
});
