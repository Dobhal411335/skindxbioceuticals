import {
  aboutUsBannerConfigBodySchema,
  normalizeAboutUsBannerConfigInput,
} from '../about-us-banner.validation';

describe('about-us-banner validation', () => {
  it('accepts relative button URLs and absolute image URLs', () => {
    const result = aboutUsBannerConfigBodySchema.safeParse(
      normalizeAboutUsBannerConfigInput({
        promoLabel: 'Featured',
        promoHeading: 'Offers',
        promoSubheading: 'While stocks last',
        promoButtonLabel: 'Shop now',
        promoButtonUrl: '/shop',
        aboutCards: [
          {
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/about.jpg',
            imagePublicId: 'skindx/IN/about/about',
            label: 'About us',
            heading: 'Science-led care',
            description: 'Clear product presentation.',
            buttonLabel: 'Read more',
            buttonUrl: '/about',
            active: true,
          },
        ],
        highlightItems: [],
        textSlides: [],
      }),
    );

    expect(result.success).toBe(true);
  });

  it('drops incomplete nested cards before parse', () => {
    const normalized = normalizeAboutUsBannerConfigInput({
      promoLabel: '',
      aboutCards: [
        {
          heading: '',
          description: 'Missing heading',
          buttonLabel: 'Read more',
        },
        {
          heading: 'Valid',
          description: 'Kept',
          buttonLabel: 'Read more',
          buttonUrl: '/about',
        },
      ],
      highlightItems: [{ heading: 'Only heading' }],
      textSlides: [{ heading: 'Slide', subheading: 'Body' }],
    }) as {
      aboutCards: unknown[];
      highlightItems: unknown[];
      textSlides: unknown[];
    };

    expect(normalized.aboutCards).toHaveLength(1);
    expect(normalized.highlightItems).toHaveLength(0);
    expect(normalized.textSlides).toHaveLength(1);
  });

  it('rejects non-http image URLs', () => {
    const result = aboutUsBannerConfigBodySchema.safeParse(
      normalizeAboutUsBannerConfigInput({
        aboutCards: [
          {
            imageUrl: '/uploads/local.jpg',
            heading: 'Science-led care',
            description: 'Clear product presentation.',
            buttonLabel: 'Read more',
            buttonUrl: '/about',
          },
        ],
      }),
    );

    expect(result.success).toBe(false);
  });
});
