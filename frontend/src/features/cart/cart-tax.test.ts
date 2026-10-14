import {
  cartLineTaxInPaise,
  selectCartCgstTotal,
  selectCartSgstTotal,
  selectCartTaxTotal,
} from "@/features/cart/cart-tax";
import type { CartItem } from "@/types/cart";

const baseItem: CartItem = {
  id: "p:v",
  productId: "11111111-1111-4111-8111-111111111111",
  variantId: "22222222-2222-4222-8222-222222222222",
  slug: "serum",
  name: "Serum",
  image: "",
  alt: "Serum",
  quantity: 3,
  unitPriceInPaise: 5000,
  originalUnitPriceInPaise: 15000,
  cgstPercent: 9,
  sgstPercent: 9,
};

describe("cart-tax", () => {
  it("computes CGST/SGST from original line total", () => {
    // Original line = 15000 * 3 = 45000 paise; 9% = 4050 each
    expect(cartLineTaxInPaise(baseItem)).toEqual({
      cgstInPaise: 4050,
      sgstInPaise: 4050,
      taxInPaise: 8100,
    });
  });

  it("sums cart tax totals", () => {
    expect(selectCartCgstTotal([baseItem])).toBe(4050);
    expect(selectCartSgstTotal([baseItem])).toBe(4050);
    expect(selectCartTaxTotal([baseItem])).toBe(8100);
  });
});
