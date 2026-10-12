import {
  heroBannerConfigBodySchema,
  normalizeHeroBannerConfigInput,
} from '../hero-banner.validation';

describe('heroBannerConfigBodySchema', () => {
  it('accepts an image-only full-width slide with optional click URL', () => {
    const result = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'FULL_WIDTH',
          desktopImageUrl: 'https://cdn.example.com/desktop.jpg',
          mobileImageUrl: 'https://cdn.example.com/mobile.jpg',
          buttonUrl: '/shop',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slides[0]!.mainHeading).toBe('');
      expect(result.data.slides[0]!.buttonLabel).toBe('');
      expect(result.data.slides[0]!.buttonUrl).toBe('/shop');
    }
  });

  it('rejects full-width slides without images', () => {
    const result = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'FULL_WIDTH',
          mainHeading: 'Should be ignored',
          buttonLabel: 'Shop',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('requires two CTA labels and side images for split dual', () => {
    const missingCta = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'SPLIT_DUAL',
          mainHeading: 'SkinDx Bioc',
          buttonLabel: 'Shop products',
          buttonUrl: '/shop',
          button2Label: '',
          button2Url: '/categories',
          leftImageUrl: 'https://cdn.example.com/left.jpg',
          rightImageUrl: 'https://cdn.example.com/right.jpg',
        },
      ],
    });
    expect(missingCta.success).toBe(false);

    const ok = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'SPLIT_DUAL',
          mainHeading: 'SkinDx Bioc',
          buttonLabel: 'Shop products',
          buttonUrl: '/shop',
          button2Label: 'Explore',
          button2Url: '/categories',
          leftImageUrl: 'https://cdn.example.com/left.jpg',
          rightImageUrl: 'https://cdn.example.com/right.jpg',
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('requires 4–6 grid images for multi-image', () => {
    const tooFew = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'MULTI_IMAGE',
          mainHeading: 'our associate brand',
          buttonLabel: 'Explore More',
          buttonUrl: '/about',
          gridImages: [
            { imageUrl: 'https://cdn.example.com/1.jpg' },
            { imageUrl: 'https://cdn.example.com/2.jpg' },
            { imageUrl: 'https://cdn.example.com/3.jpg' },
          ],
        },
      ],
    });
    expect(tooFew.success).toBe(false);

    const ok = heroBannerConfigBodySchema.safeParse({
      slides: [
        {
          layoutType: 'MULTI_IMAGE',
          mainHeading: 'our associate brand',
          buttonLabel: 'Explore More',
          buttonUrl: '/about',
          gridImages: [
            { imageUrl: 'https://cdn.example.com/1.jpg' },
            { imageUrl: 'https://cdn.example.com/2.jpg' },
            { imageUrl: 'https://cdn.example.com/3.jpg' },
            { imageUrl: 'https://cdn.example.com/4.jpg' },
          ],
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('normalizes alternate field names before parse', () => {
    const normalized = normalizeHeroBannerConfigInput({
      slides: [
        {
          variant: 'full-width',
          laptopImageUrl: 'https://cdn.example.com/d.jpg',
          mobileImageUrl: 'https://cdn.example.com/m.jpg',
          heading: 'Ignored for full width',
          ctaLabel: 'Ignored',
        },
      ],
    });

    const result = heroBannerConfigBodySchema.safeParse(normalized);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slides[0]!.layoutType).toBe('FULL_WIDTH');
      expect(result.data.slides[0]!.desktopImageUrl).toBe(
        'https://cdn.example.com/d.jpg',
      );
      expect(result.data.slides[0]!.mainHeading).toBe('');
    }
  });
});
