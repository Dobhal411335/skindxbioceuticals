import {
  adminProductListQuerySchema,
  catalogProductBodySchema,
  normalizeCatalogProductInput,
  publicProductListQuerySchema,
  publicProductSlugParamSchema,
} from '../product.validation';

describe('catalog product validation', () => {
  it('accepts a valid product body', () => {
    const parsed = catalogProductBodySchema.parse({
      productCode: 'VC-01',
      name: 'Vitamin C Serum',
      active: true,
    });
    expect(parsed.productCode).toBe('VC-01');
  });

  it('rejects invalid product codes', () => {
    expect(() =>
      catalogProductBodySchema.parse({
        productCode: 'bad code!',
        name: 'Vitamin C Serum',
      }),
    ).toThrow();
  });

  it('normalizes code alias', () => {
    const normalized = normalizeCatalogProductInput({
      code: '  VC-01  ',
      name: '  Serum  ',
    });
    expect(normalized).toMatchObject({
      productCode: 'VC-01',
      name: 'Serum',
      active: true,
    });
  });

  it('accepts a public product slug param', () => {
    const parsed = publicProductSlugParamSchema.parse({
      siteCode: 'in',
      slug: 'vitamin-c-serum',
    });
    expect(parsed.siteCode).toBe('IN');
    expect(parsed.slug).toBe('vitamin-c-serum');
  });

  it('rejects invalid public product slugs', () => {
    expect(() =>
      publicProductSlugParamSchema.parse({
        siteCode: 'IN',
        slug: 'Bad Slug!',
      }),
    ).toThrow();
  });

  it('accepts landing flag fields on create body', () => {
    const parsed = catalogProductBodySchema.parse({
      productCode: 'VC-01',
      name: 'Vitamin C Serum',
      active: true,
      isFeatured: true,
      isRecent: true,
      isBestSeller: false,
    });
    expect(parsed.isFeatured).toBe(true);
    expect(parsed.isRecent).toBe(true);
    expect(parsed.isBestSeller).toBe(false);
  });

  it('accepts catalog list query defaults', () => {
    const parsed = publicProductListQuerySchema.parse({});
    expect(parsed).toMatchObject({
      page: 1,
      limit: 15,
      sort: 'default',
    });
  });

  it('rejects catalog list query when priceMin exceeds priceMax', () => {
    expect(() =>
      publicProductListQuerySchema.parse({ priceMin: 200, priceMax: 100 }),
    ).toThrow();
  });

  it('rejects unknown catalog sort values', () => {
    expect(() =>
      publicProductListQuerySchema.parse({ sort: 'popularity' }),
    ).toThrow();
  });

  it('defaults admin product list period to today and limit to 10', () => {
    const parsed = adminProductListQuerySchema.parse({});
    expect(parsed).toMatchObject({
      period: 'today',
      status: 'all',
      page: 1,
      limit: 10,
    });
  });

  it('requires date when admin list period is day', () => {
    expect(() => adminProductListQuerySchema.parse({ period: 'day' })).toThrow();
    const parsed = adminProductListQuerySchema.parse({
      period: 'day',
      date: '2026-10-15',
    });
    expect(parsed.date).toBe('2026-10-15');
  });
});
