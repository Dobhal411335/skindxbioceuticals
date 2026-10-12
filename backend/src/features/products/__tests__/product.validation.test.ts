import {
  catalogProductBodySchema,
  normalizeCatalogProductInput,
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
});
