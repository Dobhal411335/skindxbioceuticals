import {
  categoryBodySchema,
  normalizeCategoryInput,
  subcategoryBodySchema,
} from '../category.validation';

describe('category validation', () => {
  it('accepts a valid category body', () => {
    const parsed = categoryBodySchema.parse({
      name: 'Serums',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      bannerPublicId: 'categories/banner',
      active: true,
    });
    expect(parsed.name).toBe('Serums');
  });

  it('rejects missing banner URL', () => {
    expect(() =>
      categoryBodySchema.parse({
        name: 'Serums',
        bannerPublicId: '',
      }),
    ).toThrow();
  });

  it('normalizes nested banner object input', () => {
    const normalized = normalizeCategoryInput({
      name: '  Serums  ',
      banner: {
        url: 'https://cdn.example.com/banner.jpg',
        publicId: 'categories/banner',
      },
    });
    expect(normalized).toMatchObject({
      name: 'Serums',
      bannerUrl: 'https://cdn.example.com/banner.jpg',
      bannerPublicId: 'categories/banner',
    });
  });

  it('accepts a subcategory name body', () => {
    const parsed = subcategoryBodySchema.parse({ name: 'Vitamin C' });
    expect(parsed.active).toBe(true);
    expect(parsed.name).toBe('Vitamin C');
  });
});
