/**
 * @jest-environment jsdom
 */
import {
  clearGuestWishlist,
  GUEST_WISHLIST_STORAGE_KEY,
  readGuestWishlist,
  toSyncPayload,
  writeGuestWishlist,
} from "@/lib/guest-wishlist-storage";

const PRODUCT_A = "11111111-1111-4111-8111-111111111111";
const PRODUCT_B = "22222222-2222-4222-8222-222222222222";
const VARIANT_A = "33333333-3333-4333-8333-333333333333";

describe("guest-wishlist-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty bag when storage is empty", () => {
    expect(readGuestWishlist()).toEqual({ version: 1, items: [] });
  });

  it("persists and reads guest wishlist items", () => {
    const ok = writeGuestWishlist([
      {
        productId: PRODUCT_A,
        variantId: VARIANT_A,
        productName: "Serum",
        productSlug: "serum",
      },
    ]);
    expect(ok).toBe(true);

    expect(readGuestWishlist().items).toEqual([
      {
        productId: PRODUCT_A,
        variantId: VARIANT_A,
        productName: "Serum",
        productSlug: "serum",
        imageUrl: null,
        price: null,
        currency: null,
      },
    ]);
  });

  it("ignores invalid JSON and clears via clearGuestWishlist", () => {
    window.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, "{not-json");
    expect(readGuestWishlist()).toEqual({ version: 1, items: [] });

    writeGuestWishlist([{ productId: PRODUCT_A }]);
    clearGuestWishlist();
    expect(window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)).toBeNull();
  });

  it("keeps valid items when the bag contains a bad entry", () => {
    window.localStorage.setItem(
      GUEST_WISHLIST_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [
          {
            productId: PRODUCT_A,
            variantId: "",
            productName: "Serum",
            productSlug: "serum",
            price: 1299,
          },
          { productId: "not-a-uuid", productName: "Bad" },
          { productId: PRODUCT_B, productSlug: "other", variantId: "bad-variant" },
        ],
      }),
    );

    const items = readGuestWishlist().items;
    expect(items.map((item) => item.productId)).toEqual([
      PRODUCT_A,
      "not-a-uuid",
      PRODUCT_B,
    ]);
    expect(items[0]?.variantId).toBeNull();
    expect(items[0]?.price).toBe("1299");
    expect(items[2]?.variantId).toBeNull();
  });

  it("builds a deduped sync payload of uuid ids only", () => {
    const payload = toSyncPayload({
      version: 1,
      items: [
        {
          productId: PRODUCT_A,
          variantId: VARIANT_A,
          productName: "Serum",
        },
        { productId: PRODUCT_A, variantId: null },
        { productId: PRODUCT_B },
        { productId: "not-a-uuid" },
      ],
    });

    expect(payload).toEqual([
      { productId: PRODUCT_A, variantId: VARIANT_A },
      { productId: PRODUCT_B, variantId: null },
    ]);
  });
});
