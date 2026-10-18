import {
  adminStockListQuerySchema,
  adminStockVariantQtyBodySchema,
} from '../inventory.validation';

describe('admin stock validation', () => {
  it('applies defaults for stock list query', () => {
    const parsed = adminStockListQuerySchema.parse({});
    expect(parsed).toEqual(
      expect.objectContaining({
        status: 'all',
        page: 1,
        limit: 10,
      }),
    );
  });

  it('accepts status filters and search', () => {
    const parsed = adminStockListQuerySchema.parse({
      status: 'ACTIVE',
      q: 'serum',
      categoryId: '11111111-1111-1111-1111-111111111111',
      limit: 20,
    });
    expect(parsed.status).toBe('ACTIVE');
    expect(parsed.q).toBe('serum');
    expect(parsed.limit).toBe(20);
  });

  it('rejects invalid categoryId', () => {
    expect(() =>
      adminStockListQuerySchema.parse({ categoryId: 'not-a-uuid' }),
    ).toThrow();
  });

  it('requires non-negative integer quantity', () => {
    expect(adminStockVariantQtyBodySchema.parse({ quantity: 0 }).quantity).toBe(0);
    expect(adminStockVariantQtyBodySchema.parse({ quantity: '12' }).quantity).toBe(12);
    expect(() => adminStockVariantQtyBodySchema.parse({ quantity: -1 })).toThrow();
    expect(() => adminStockVariantQtyBodySchema.parse({ quantity: 1.5 })).toThrow();
  });
});
