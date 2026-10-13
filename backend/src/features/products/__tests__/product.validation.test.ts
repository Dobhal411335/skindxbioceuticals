import {
  catalogProductBodySchema,
  normalizeCatalogProductInput,
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
});
