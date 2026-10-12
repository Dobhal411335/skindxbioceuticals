import {
  categoryBodySchema,
  normalizeCategoryInput,
  normalizeSubcategoryInput,
  subcategoryBodySchema,
} from '../category.validation';

describe('category validation', () => {
  it('accepts a valid root category body without banner', () => {
    const parsed = categoryBodySchema.parse({
      name: 'Serums',
      active: true,
    });
    expect(parsed.name).toBe('Serums');
    expect(parsed.active).toBe(true);
  });

  it('rejects empty root category name', () => {
    expect(() =>
      categoryBodySchema.parse({
        name: '   ',
        active: true,
      }),
    ).toThrow();
  });

  it('normalizes root category name input', () => {
    const normalized = normalizeCategoryInput({
      name: '  Serums  ',
      active: true,
    });
    expect(normalized).toMatchObject({
      name: 'Serums',
      active: true,
    });
  });

  it('accepts a subcategory body with banner', () => {
    const parsed = subcategoryBodySchema.parse({
      name: 'Vitamin C',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      bannerPublicId: 'categories/banner',
      active: true,
    });
    expect(parsed.active).toBe(true);
    expect(parsed.name).toBe('Vitamin C');
    expect(parsed.bannerUrl).toBe('https://cdn.example.com/banner.jpg');
  });

  it('rejects subcategory missing banner URL', () => {
    expect(() =>
      subcategoryBodySchema.parse({
        name: 'Vitamin C',
        bannerPublicId: '',
      }),
    ).toThrow();
  });

  it('normalizes nested banner object on subcategory input', () => {
    const normalized = normalizeSubcategoryInput({
      name: '  Vitamin C  ',
      banner: {
        url: 'https://cdn.example.com/banner.jpg',
        publicId: 'categories/banner',
      },
    });
    expect(normalized).toMatchObject({
      name: 'Vitamin C',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      bannerPublicId: 'categories/banner',
    });
  });
});
