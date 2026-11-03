import {
  categoryBodySchema,
  normalizeCategoryInput,
  normalizeSubcategoryInput,
  subcategoryBodySchema,
} from '../category.validation';

describe('category validation', () => {
  it('accepts a valid root category body with image', () => {
    const parsed = categoryBodySchema.parse({
      name: 'Serums',
      bannerUrl: 'https://cdn.example.com/category.jpg',
      bannerPublicId: 'categories/root',
      active: true,
    });
    expect(parsed.name).toBe('Serums');
    expect(parsed.active).toBe(true);
    expect(parsed.bannerUrl).toBe('https://cdn.example.com/category.jpg');
  });

  it('rejects root category missing image URL', () => {
    expect(() =>
      categoryBodySchema.parse({
        name: 'Serums',
        active: true,
      }),
    ).toThrow();
  });

  it('rejects empty root category name', () => {
    expect(() =>
      categoryBodySchema.parse({
        name: '   ',
        bannerUrl: 'https://cdn.example.com/category.jpg',
        active: true,
      }),
    ).toThrow();
  });

  it('normalizes root category name and banner input', () => {
    const normalized = normalizeCategoryInput({
      name: '  Serums  ',
      banner: {
        url: 'https://cdn.example.com/category.jpg',
        publicId: 'categories/root',
      },
      active: true,
    });
    expect(normalized).toMatchObject({
      name: 'Serums',
      bannerUrl: 'https://cdn.example.com/category.jpg',
      bannerPublicId: 'categories/root',
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
