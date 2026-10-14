/**
 * @jest-environment jsdom
 */

import {
  clearGuestCart,
  GUEST_CART_STORAGE_KEY,
  readGuestCart,
  toCartSyncPayload,
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
});
