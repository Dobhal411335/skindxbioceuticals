import {
  galleryItemBodySchema,
  normalizeGalleryItemInput,
} from '../gallery.validation';

describe('galleryItemBodySchema', () => {
  it('accepts image items with optional clickUrl', () => {
    const result = galleryItemBodySchema.safeParse({
      mediaType: 'image',
      mediaUrl: 'https://cdn.example.com/a.jpg',
      mediaPublicId: 'gallery/a',
      clickUrl: '/shop',
      active: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clickUrl).toBe('/shop');
      expect(result.data.heading).toBe('');
    }
  });

  it('rejects media items without mediaUrl', () => {
    const result = galleryItemBodySchema.safeParse({
      mediaType: 'video',
      mediaUrl: '',
      mediaPublicId: '',
      active: true,
    });

    expect(result.success).toBe(false);
  });

  it('accepts text cards with heading, description, and button fields', () => {
    const result = galleryItemBodySchema.safeParse({
      mediaType: 'text_card',
      heading: 'HÄLLAN',
      description: 'Soft light and calm routines.',
      buttonLabel: 'Explore',
      buttonUrl: 'https://example.com/shop',
      active: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mediaUrl).toBe('');
      expect(result.data.buttonLabel).toBe('Explore');
    }
  });

  it('rejects text cards missing buttonUrl', () => {
    const result = galleryItemBodySchema.safeParse({
      mediaType: 'text_card',
      heading: 'HÄLLAN',
      description: 'Soft light and calm routines.',
      buttonLabel: 'Explore',
      buttonUrl: '',
      active: true,
    });

    expect(result.success).toBe(false);
  });

  it('normalizes nested media upload shapes and text aliases', () => {
    const normalized = normalizeGalleryItemInput({
      type: 'text-card',
      subDescription: 'Copy',
      heading: 'Title',
      buttonLabel: 'Go',
      buttonUrl: '/go',
      media: { secureUrl: 'https://cdn.example.com/x.jpg', publicId: 'x' },
    }) as Record<string, unknown>;

    expect(normalized.mediaType).toBe('text_card');
    expect(normalized.description).toBe('Copy');
    expect(normalized.mediaUrl).toBe('https://cdn.example.com/x.jpg');
    expect(normalized.mediaPublicId).toBe('x');
  });
});
