import {
  adminProductPriceApplyBodySchema,
  adminProductPriceListQuerySchema,
  pricePercentSchema,
} from '../product-prices.validation';

describe('product-prices validation', () => {
  it('rejects zero percent', () => {
    expect(() => pricePercentSchema.parse(0)).toThrow();
  });

  it('accepts positive and negative percent within bounds', () => {
    expect(pricePercentSchema.parse(10)).toBe(10);
    expect(pricePercentSchema.parse(-15.5)).toBe(-15.5);
    expect(pricePercentSchema.parse('12')).toBe(12);
  });

  it('rejects percent at or below -100', () => {
    expect(() => pricePercentSchema.parse(-100)).toThrow();
    expect(() => pricePercentSchema.parse(-101)).toThrow();
  });

  it('applies list query defaults', () => {
    const parsed = adminProductPriceListQuerySchema.parse({});
    expect(parsed).toEqual(
      expect.objectContaining({
        status: 'all',
        page: 1,
        limit: 10,
      }),
    );
  });

  it('requires exactly one of productId or categoryId on apply', () => {
    expect(() => adminProductPriceApplyBodySchema.parse({ percent: 10 })).toThrow();
    expect(() =>
      adminProductPriceApplyBodySchema.parse({
        percent: 10,
        productId: '11111111-1111-1111-1111-111111111111',
        categoryId: '22222222-2222-2222-2222-222222222222',
      }),
    ).toThrow();

    expect(
      adminProductPriceApplyBodySchema.parse({
        percent: -5,
        categoryId: '22222222-2222-2222-2222-222222222222',
      }).categoryId,
    ).toBe('22222222-2222-2222-2222-222222222222');

    expect(
      adminProductPriceApplyBodySchema.parse({
        percent: 8,
        productId: '11111111-1111-1111-1111-111111111111',
      }).productId,
    ).toBe('11111111-1111-1111-1111-111111111111');
  });
});
