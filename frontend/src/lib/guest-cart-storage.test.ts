/**
 * @jest-environment jsdom
 */

import {
  ACCOUNT_CART_CACHE_KEY,
  clearAccountCartCache,
  clearGuestCart,
  GUEST_CART_STORAGE_KEY,
  readAccountCartCache,
  readCartLocalPaint,
  readGuestCart,
  toCartSyncPayload,
  writeAccountCartCache,
  writeGuestCart,
} from "@/lib/guest-cart-storage";

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const VARIANT_ID = "22222222-2222-4222-8222-222222222222";

describe("guest-cart-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty bag when nothing is stored", () => {
    expect(readGuestCart()).toEqual({ version: 1, items: [] });
  });

  it("persists and reads cart lines", () => {
    expect(
      writeGuestCart([
        {
          productId: PRODUCT_ID,
          variantId: VARIANT_ID,
          quantity: 2,
          productName: "Serum",
          unitPriceInPaise: 90000,
        },
      ]),
    ).toBe(true);

    expect(readGuestCart().items).toEqual([
      expect.objectContaining({
        productId: PRODUCT_ID,
        variantId: VARIANT_ID,
        quantity: 2,
        productName: "Serum",
        unitPriceInPaise: 90000,
      }),
    ]);
  });

  it("clears guest cart storage", () => {
    writeGuestCart([
      { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 },
    ]);
    clearGuestCart();
    expect(window.localStorage.getItem(GUEST_CART_STORAGE_KEY)).toBeNull();
    expect(readGuestCart()).toEqual({ version: 1, items: [] });
  });

  it("builds a sync payload from the bag", () => {
    const bag = {
      version: 1 as const,
      items: [
        { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 3 },
      ],
    };
    expect(toCartSyncPayload(bag)).toEqual([
      { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 3 },
    ]);
  });

  it("ignores invalid product ids", () => {
    window.localStorage.setItem(
      GUEST_CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [{ productId: "not-a-uuid", variantId: VARIANT_ID, quantity: 1 }],
      }),
    );
    expect(readGuestCart().items).toEqual([]);
  });

  it("reads account cache for cross-tab paint when guest bag is empty", () => {
    writeAccountCartCache([
      { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 },
    ]);
    expect(readCartLocalPaint().items).toHaveLength(1);
    expect(readAccountCartCache().items[0]?.variantId).toBe(VARIANT_ID);
    clearAccountCartCache();
    expect(window.localStorage.getItem(ACCOUNT_CART_CACHE_KEY)).toBeNull();
  });

  it("prefers guest bag over account cache for local paint", () => {
    const otherVariant = "33333333-3333-4333-8333-333333333333";
    writeAccountCartCache([
      { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 1 },
    ]);
    writeGuestCart([
      { productId: PRODUCT_ID, variantId: otherVariant, quantity: 2 },
    ]);
    expect(readCartLocalPaint().items[0]?.variantId).toBe(otherVariant);
  });
});
