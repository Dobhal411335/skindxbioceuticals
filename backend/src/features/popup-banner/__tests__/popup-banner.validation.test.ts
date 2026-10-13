import {
  normalizePopupBannerConfigInput,
  popupBannerConfigBodySchema,
} from '../popup-banner.validation';

describe('popupBannerConfigBodySchema', () => {
  it('accepts inactive empty defaults', () => {
    const result = popupBannerConfigBodySchema.safeParse(
      normalizePopupBannerConfigInput({ active: false }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
      expect(result.data.heading).toBe('');
    }
  });

  it('requires image, heading, button label, and URL when active', () => {
    const result = popupBannerConfigBodySchema.safeParse(
      normalizePopupBannerConfigInput({
        active: true,
        miniHeading: 'Mini',
        subDescription: 'Copy',
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts a complete active payload', () => {
    const result = popupBannerConfigBodySchema.safeParse(
      normalizePopupBannerConfigInput({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/popup.jpg',
        imagePublicId: 'popup/main',
        miniHeading: 'SkinDx Bioc',
        heading: 'Explore the SkinDx range',
        subDescription: 'Clear product information.',
        buttonLabel: 'Shop now',
        buttonUrl: '/category',
        active: true,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects invalid button URLs', () => {
    const result = popupBannerConfigBodySchema.safeParse(
      normalizePopupBannerConfigInput({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/popup.jpg',
        imagePublicId: 'popup/main',
        heading: 'Explore',
        buttonLabel: 'Shop now',
        buttonUrl: 'not a url',
        active: true,
      }),
    );
    expect(result.success).toBe(false);
  });
});
