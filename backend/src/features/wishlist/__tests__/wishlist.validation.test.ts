import { syncWishlistSchema } from '../wishlist.validation';

describe('wishlist.validation syncWishlistSchema', () => {
  it('accepts empty and valid guest bags', () => {
    expect(syncWishlistSchema.parse({ items: [] })).toEqual({ items: [] });
    expect(
      syncWishlistSchema.parse({
        items: [
          {
            productId: '11111111-1111-4111-8111-111111111111',
            variantId: '22222222-2222-4222-8222-222222222222',
          },
        ],
      }).items,
    ).toHaveLength(1);
  });

  it('rejects invalid product ids', () => {
    expect(() =>
      syncWishlistSchema.parse({
        items: [{ productId: 'not-a-uuid' }],
      }),
    ).toThrow();
  });
});
