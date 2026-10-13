import { ConflictError, NotFoundError } from '@/utils/AppError';
import { WishlistService } from '../wishlist.service';
import type { WishlistRepository } from '../wishlist.repository';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const WISHLIST_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PRODUCT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const VARIANT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const OTHER_PRODUCT_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    wishlistId: WISHLIST_ID,
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    product: {
      id: PRODUCT_ID,
      name: 'Barrier Serum',
      slug: 'barrier-serum',
      status: 'ACTIVE',
      site: { code: 'IN', isActive: true },
      variants: [
        {
          id: VARIANT_ID,
          price: { toString: () => '1299.00' },
          currency: 'INR',
          inventory: { quantityOnHand: 5, quantityReserved: 0 },
        },
      ],
      media: [],
    },
    variant: {
      id: VARIANT_ID,
      price: { toString: () => '1299.00' },
      currency: 'INR',
      inventory: { quantityOnHand: 5, quantityReserved: 0 },
    },
    ...overrides,
  };
}

describe('WishlistService', () => {
  const findById = jest.fn();
  const findOrCreateWishlist = jest.fn();
  const findActiveInProduct = jest.fn();
  const findProductEligibility = jest.fn();
  const findVariantForProduct = jest.fn();
  const addItem = jest.fn();
  const addItemsIgnoreDuplicates = jest.fn();
  const findItemForUser = jest.fn();
  const deleteItem = jest.fn();
  const findExistingItem = jest.fn();

  const repository = {
    findOrCreateWishlist,
    findActiveInProduct,
    findProductEligibility,
    findVariantForProduct,
    addItem,
    addItemsIgnoreDuplicates,
    findItemForUser,
    deleteItem,
    findExistingItem,
  } as unknown as WishlistRepository;

  const users = { findById } as { findById: typeof findById };
  const service = new WishlistService(repository, users as never);

  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({
      id: USER_ID,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
  });

  it('omits non-IN / inactive products from GET', async () => {
    const active = makeItem();
    const archived = makeItem({
      id: '11111111-1111-1111-1111-111111111111',
      productId: OTHER_PRODUCT_ID,
      product: {
        ...makeItem().product,
        id: OTHER_PRODUCT_ID,
        status: 'ARCHIVED',
        site: { code: 'IN', isActive: true },
      },
    });
    const comProduct = makeItem({
      id: '22222222-2222-2222-2222-222222222222',
      productId: '33333333-3333-3333-3333-333333333333',
      product: {
        ...makeItem().product,
        id: '33333333-3333-3333-3333-333333333333',
        site: { code: 'COM', isActive: true },
      },
    });

    findOrCreateWishlist.mockResolvedValue({
      id: WISHLIST_ID,
      items: [active, archived, comProduct],
    });

    const result = await service.getWishlist(USER_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.productId).toBe(PRODUCT_ID);
  });

  it('rejects add when product is not an active IN catalog item', async () => {
    findOrCreateWishlist.mockResolvedValue({ id: WISHLIST_ID, items: [] });
    findActiveInProduct.mockResolvedValue(null);

    await expect(
      service.addItem(USER_ID, { productId: PRODUCT_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects duplicate add with ConflictError', async () => {
    findOrCreateWishlist.mockResolvedValue({ id: WISHLIST_ID, items: [] });
    findActiveInProduct.mockResolvedValue({
      id: PRODUCT_ID,
      variants: [{ id: VARIANT_ID }],
    });
    findExistingItem.mockResolvedValue(makeItem());

    await expect(
      service.addItem(USER_ID, { productId: PRODUCT_ID }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('syncs guest items as a productId union and skips invalid entries', async () => {
    findOrCreateWishlist
      .mockResolvedValueOnce({ id: WISHLIST_ID, items: [] })
      .mockResolvedValueOnce({
        id: WISHLIST_ID,
        items: [makeItem()],
      });

    findExistingItem.mockResolvedValue(null);
    findVariantForProduct.mockResolvedValue({ id: VARIANT_ID });

    findProductEligibility
      .mockResolvedValueOnce({
        id: PRODUCT_ID,
        status: 'ACTIVE',
        site: { code: 'IN', isActive: true },
        variants: [{ id: VARIANT_ID }],
      })
      .mockResolvedValueOnce({
        id: OTHER_PRODUCT_ID,
        status: 'DRAFT',
        site: { code: 'IN', isActive: true },
        variants: [],
      });

    const result = await service.syncWishlist(USER_ID, {
      items: [
        { productId: PRODUCT_ID, variantId: VARIANT_ID },
        { productId: PRODUCT_ID, variantId: null },
        { productId: OTHER_PRODUCT_ID },
        { productId: PRODUCT_ID },
      ],
    });

    expect(addItemsIgnoreDuplicates).toHaveBeenCalledWith(WISHLIST_ID, [
      { productId: PRODUCT_ID, variantId: VARIANT_ID },
    ]);
    expect(result.skipped).toEqual([
      {
        productId: OTHER_PRODUCT_ID,
        variantId: null,
        reason: 'INACTIVE_OR_WRONG_SITE',
      },
    ]);
    expect(result.wishlist.items).toHaveLength(1);
  });

  it('treats existing account products as no-ops during sync', async () => {
    findOrCreateWishlist
      .mockResolvedValueOnce({ id: WISHLIST_ID, items: [makeItem()] })
      .mockResolvedValueOnce({ id: WISHLIST_ID, items: [makeItem()] });
    findExistingItem.mockResolvedValue(makeItem());

    const result = await service.syncWishlist(USER_ID, {
      items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID }],
    });

    expect(findProductEligibility).not.toHaveBeenCalled();
    expect(addItemsIgnoreDuplicates).toHaveBeenCalledWith(WISHLIST_ID, []);
    expect(result.skipped).toEqual([]);
    expect(result.wishlist.items).toHaveLength(1);
  });
});
