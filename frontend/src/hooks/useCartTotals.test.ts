import {
  selectCartDiscountPercent,
  selectCartOriginalSubtotal,
  selectCartProductDiscount,
  selectCartSubtotal,
} from "@/store/slices/cartSlice";
import type { CartItem } from "@/types/cart";

const items: CartItem[] = [
  {
    id: "a",
    productId: "p1",
    variantId: "v1",
    slug: "serum",
    name: "Serum",
    image: "",
    alt: "",
    quantity: 2,
    unitPriceInPaise: 90000,
    originalUnitPriceInPaise: 100000,
  },
  {
    id: "b",
    productId: "p2",
    variantId: "v2",
    slug: "cream",
    name: "Cream",
    image: "",
    alt: "",
    quantity: 1,
    unitPriceInPaise: 50000,
  },
];

describe("cart product discount totals", () => {
  it("uses original prices for subtotal and payable for total", () => {
    expect(selectCartOriginalSubtotal(items)).toBe(250000);
    expect(selectCartSubtotal(items)).toBe(230000);
    expect(selectCartProductDiscount(items)).toBe(20000);
    expect(selectCartDiscountPercent(items)).toBe(8);
  });
});
