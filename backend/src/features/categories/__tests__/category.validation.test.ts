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
      description: '<p>Face care routine</p>',
    });
    expect(parsed.name).toBe('Serums');
    expect(parsed.active).toBe(true);
    expect(parsed.bannerUrl).toBe('https://cdn.example.com/category.jpg');
    expect(parsed.description).toBe('<p>Face care routine</p>');
  });

  it('normalizes empty TipTap HTML category description to null', () => {
    const parsed = categoryBodySchema.parse({
      name: 'Serums',
      bannerUrl: 'https://cdn.example.com/category.jpg',
      bannerPublicId: 'categories/root',
      description: '<p></p>',
    });
    expect(parsed.description).toBeNull();
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
      description: '<p>Brightening serums</p>',
    });
    expect(parsed.active).toBe(true);
    expect(parsed.name).toBe('Vitamin C');
    expect(parsed.bannerUrl).toBe('https://cdn.example.com/banner.jpg');
    expect(parsed.description).toBe('<p>Brightening serums</p>');
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
      description: '  <p>Brightening</p>  ',
      banner: {
        url: 'https://cdn.example.com/banner.jpg',
        publicId: 'categories/banner',
      },
    });
    expect(normalized).toMatchObject({
      name: 'Vitamin C',
      description: '<p>Brightening</p>',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      bannerPublicId: 'categories/banner',
    });
  });
});
