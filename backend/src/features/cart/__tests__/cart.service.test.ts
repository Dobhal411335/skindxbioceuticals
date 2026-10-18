import { NotFoundError, ValidationError } from '@/utils/AppError';
import { CartService } from '../cart.service';
import type { CartRepository } from '../cart.repository';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CART_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PRODUCT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const VARIANT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const ITEM_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: ITEM_ID,
    cartId: CART_ID,
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    quantity: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    product: {
      id: PRODUCT_ID,
      name: 'Barrier Serum',
      slug: 'barrier-serum',
      productCode: 'BS-01',
      status: 'ACTIVE',
      subcategory: { name: 'Serums' },
      site: { code: 'IN', isActive: true },
      galleryImages: [
        { imageUrl: 'https://res.cloudinary.com/demo/image/upload/serum.jpg' },
      ],
      media: [],
      tax: { cgst: { toString: () => '9' }, sgst: { toString: () => '9' } },
      coupon: {
        couponId: 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
        coupon: {
          code: 'SAVE10',
          type: 'PERCENTAGE',
          value: 10,
          isActive: true,
          startsAt: null,
          endsAt: null,
        },
      },
    },
    variant: {
      id: VARIANT_ID,
      name: 'Default',
      price: { toString: () => '1000.00' },
      currency: 'INR',
      isActive: true,
      inventory: { quantityOnHand: 5, quantityReserved: 0 },
    },
    ...overrides,
  };
}

describe('CartService', () => {
  const findById = jest.fn();
  const findOrCreateCart = jest.fn();
  const findActiveInProduct = jest.fn();
  const findProductEligibility = jest.fn();
  const findVariantForProduct = jest.fn();
  const findItemByVariant = jest.fn();
  const findItemForUser = jest.fn();
  const upsertItem = jest.fn();
  const updateItemQuantity = jest.fn();
  const deleteItem = jest.fn();
  const clearItems = jest.fn();

  const repository = {
    findOrCreateCart,
    findActiveInProduct,
    findProductEligibility,
    findVariantForProduct,
    findItemByVariant,
    findItemForUser,
    upsertItem,
    updateItemQuantity,
    deleteItem,
    clearItems,
  } as unknown as CartRepository;

  const users = { findById } as { findById: typeof findById };
  const service = new CartService(repository, users as never);

  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({
      id: USER_ID,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
  });

  it('returns cart items with coupon pricing', async () => {
    findOrCreateCart.mockResolvedValue({
      id: CART_ID,
      items: [makeCartItem()],
    });

    const result = await service.getCart(USER_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.listPrice).toBe('1000.00');
    expect(result.items[0]?.unitPrice).toBe('900.00');
    expect(result.items[0]?.discountCode).toBe('SAVE10');
    expect(result.items[0]?.discountAmount).toBe('100.00');
    expect(result.items[0]?.imageUrl).toContain('serum.jpg');
    expect(result.items[0]?.productCode).toBe('BS-01');
    expect(result.items[0]?.categoryName).toBe('Serums');
    expect(result.items[0]?.cgstPercent).toBe(9);
    expect(result.items[0]?.sgstPercent).toBe(9);
  });

  it('adds a line capped at available stock', async () => {
    findOrCreateCart.mockResolvedValue({ id: CART_ID, items: [] });
    findActiveInProduct.mockResolvedValue({
      id: PRODUCT_ID,
      status: 'ACTIVE',
      site: { code: 'IN', isActive: true },
      variants: [],
    });
    findVariantForProduct.mockResolvedValue({
      id: VARIANT_ID,
      inventory: { quantityOnHand: 3, quantityReserved: 0 },
    });
    findItemByVariant.mockResolvedValue({ ...makeCartItem(), quantity: 2 });
    upsertItem.mockResolvedValue(makeCartItem({ quantity: 3 }));

    const item = await service.addItem(USER_ID, {
      productId: PRODUCT_ID,
      variantId: VARIANT_ID,
      quantity: 5,
    });

    expect(upsertItem).toHaveBeenCalledWith(CART_ID, PRODUCT_ID, VARIANT_ID, 3);
    expect(item.quantity).toBe(3);
  });

  it('rejects add when product is missing', async () => {
    findOrCreateCart.mockResolvedValue({ id: CART_ID, items: [] });
    findActiveInProduct.mockResolvedValue(null);

    await expect(
      service.addItem(USER_ID, {
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('merges guest quantities on sync and skips out-of-stock', async () => {
    findOrCreateCart
      .mockResolvedValueOnce({ id: CART_ID, items: [] })
      .mockResolvedValueOnce({
        id: CART_ID,
        items: [makeCartItem({ quantity: 2 })],
      });

    findProductEligibility.mockResolvedValue({
      id: PRODUCT_ID,
      status: 'ACTIVE',
      site: { code: 'IN', isActive: true },
      variants: [],
    });
    findVariantForProduct.mockResolvedValue({
      id: VARIANT_ID,
      inventory: { quantityOnHand: 2, quantityReserved: 0 },
    });
    findItemByVariant.mockResolvedValue(null);
    upsertItem.mockResolvedValue(makeCartItem({ quantity: 2 }));

    const otherProduct = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    findProductEligibility
      .mockResolvedValueOnce({
        id: PRODUCT_ID,
        status: 'ACTIVE',
        site: { code: 'IN', isActive: true },
        variants: [],
      })
      .mockResolvedValueOnce({
        id: otherProduct,
        status: 'ACTIVE',
        site: { code: 'IN', isActive: true },
        variants: [],
      });

    findVariantForProduct
      .mockResolvedValueOnce({
        id: VARIANT_ID,
        inventory: { quantityOnHand: 2, quantityReserved: 0 },
      })
      .mockResolvedValueOnce({
        id: '11111111-1111-1111-1111-111111111111',
        inventory: { quantityOnHand: 0, quantityReserved: 0 },
      });

    const result = await service.syncCart(USER_ID, {
      items: [
        { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 2 },
        {
          productId: otherProduct,
          variantId: '11111111-1111-1111-1111-111111111111',
          quantity: 1,
        },
      ],
    });

    expect(upsertItem).toHaveBeenCalledWith(CART_ID, PRODUCT_ID, VARIANT_ID, 2);
    expect(result.skipped).toEqual([
      {
        productId: otherProduct,
        variantId: '11111111-1111-1111-1111-111111111111',
        reason: 'OUT_OF_STOCK',
      },
    ]);
    expect(result.cart.items[0]?.unitPrice).toBe('900.00');
  });

  it('rejects update when item is missing', async () => {
    findItemForUser.mockResolvedValue(null);
    await expect(
      service.updateItem(USER_ID, ITEM_ID, { quantity: 2 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects update when stock is exhausted', async () => {
    findItemForUser.mockResolvedValue(
      makeCartItem({
        variant: {
          id: VARIANT_ID,
          name: 'Default',
          price: { toString: () => '1000.00' },
          currency: 'INR',
          isActive: true,
          inventory: { quantityOnHand: 0, quantityReserved: 0 },
        },
      }),
    );
    deleteItem.mockResolvedValue(undefined);

    await expect(
      service.updateItem(USER_ID, ITEM_ID, { quantity: 2 }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(deleteItem).toHaveBeenCalledWith(ITEM_ID);
  });

  it('skips product coupons for VENDOR and uses vendorPrice', async () => {
    findById.mockResolvedValue({
      id: USER_ID,
      role: 'VENDOR',
      status: 'ACTIVE',
    });
    findOrCreateCart.mockResolvedValue({
      id: CART_ID,
      items: [
        makeCartItem({
          variant: {
            id: VARIANT_ID,
            name: 'Default',
            price: { toString: () => '1000.00' },
            vendorPrice: { toString: () => '800.00' },
            currency: 'INR',
            isActive: true,
            inventory: { quantityOnHand: 5, quantityReserved: 0 },
          },
        }),
      ],
    });

    const result = await service.getCart(USER_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.listPrice).toBe('800.00');
    expect(result.items[0]?.unitPrice).toBe('800.00');
    expect(result.items[0]?.discountAmount).toBe('0.00');
    expect(result.items[0]?.discountCode).toBeNull();
    expect(result.items[0]?.coupon).toBeNull();
  });

});
