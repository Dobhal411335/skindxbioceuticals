import {
  catalogColorBodySchema,
  catalogTagBodySchema,
  productDescriptionSectionSchema,
  productEditorialReviewBodySchema,
  productGallerySectionSchema,
  productInfoSectionSchema,
  productSizesSectionSchema,
  productTaxSectionSchema,
  productVariantsSectionSchema,
  productVideosSectionSchema,
} from '../product-edit.validation';

describe('product-edit validation', () => {
  it('accepts size section payload', () => {
    const parsed = productSizesSectionSchema.parse({
      sizeChartUrl: 'https://res.cloudinary.com/demo/image/upload/chart.png',
      sizeChartPublicId: 'products/chart',
      sizes: [{ label: '30ml', active: true }],
    });
    expect(parsed.sizes[0]?.label).toBe('30ml');
  });

  it('rejects invalid color hex', () => {
    expect(() => catalogColorBodySchema.parse({ name: 'Blue', hex: 'blue' })).toThrow();
  });

  it('accepts catalog tag name', () => {
    const parsed = catalogTagBodySchema.parse({ name: '  Hydrating  ' });
    expect(parsed.name).toBe('Hydrating');
  });

  it('rejects empty catalog tag name', () => {
    expect(() => catalogTagBodySchema.parse({ name: '   ' })).toThrow();
  });

  it('accepts variant offer rows', () => {
    const parsed = productVariantsSectionSchema.parse({
      variants: [
        {
          sizeLabel: '30ml',
          colorLabel: 'Clear',
          price: 499,
          quantity: 10,
          subImages: [],
        },
      ],
    });
    expect(parsed.variants).toHaveLength(1);
    expect(parsed.variants[0]?.price).toBe(499);
  });

  it('accepts tax percentages', () => {
    const parsed = productTaxSectionSchema.parse({ cgst: 9, sgst: 9 });
    expect(parsed.cgst).toBe(9);
  });

  it('accepts gallery section with banner and images', () => {
    const parsed = productGallerySectionSchema.parse({
      bannerUrl: 'https://res.cloudinary.com/demo/image/upload/banner.png',
      bannerPublicId: 'products/banner',
      images: [
        {
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/g1.png',
          imagePublicId: 'products/g1',
          isPrimary: true,
        },
      ],
    });
    expect(parsed.bannerPublicId).toBe('products/banner');
    expect(parsed.images).toHaveLength(1);
  });

  it('accepts gallery section with cleared banner', () => {
    const parsed = productGallerySectionSchema.parse({
      bannerUrl: null,
      bannerPublicId: null,
      images: [],
    });
    expect(parsed.bannerUrl).toBeNull();
    expect(parsed.images).toEqual([]);
  });

  it('accepts HTML for video description, overview, info body, and review body', () => {
    const html =
      '<p style="text-align: center"><strong>Rich</strong> copy</p><table><tr><td>A</td></tr></table>';

    expect(
      productVideosSectionSchema.parse({
        videos: [
          {
            name: 'Demo',
            url: 'https://www.youtube.com/watch?v=demo',
            description: html,
          },
        ],
      }).videos[0]?.description,
    ).toBe(html);

    expect(productDescriptionSectionSchema.parse({ description: html }).description).toBe(html);

    expect(
      productInfoSectionSchema.parse({
        sections: [{ title: 'Ingredients', body: html }],
      }).sections[0]?.body,
    ).toBe(html);

    expect(
      productEditorialReviewBodySchema.parse({
        createdByName: 'Editor',
        rating: 5,
        title: 'Loved it',
        body: html,
      }).body,
    ).toBe(html);
  });
});
