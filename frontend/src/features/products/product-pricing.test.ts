import {
  applyProductCoupon,
  discountBannerText,
  formatWeightGrams,
  stockQtyBadgeClass,
} from "@/features/products/product-pricing";

describe("applyProductCoupon", () => {
  it("returns the list price when no coupon is set", () => {
    expect(applyProductCoupon(500, null)).toEqual({
      originalPrice: 500,
      unitPrice: 500,
      discountAmount: 0,
      coupon: null,
      hasDiscount: false,
    });
  });

  it("applies a percentage coupon", () => {
    const result = applyProductCoupon(1000, {
      couponId: "c1",
      code: "SAVE10",
      type: "PERCENTAGE",
      value: 10,
    });
    expect(result.unitPrice).toBe(900);
    expect(result.discountAmount).toBe(100);
    expect(result.hasDiscount).toBe(true);
    expect(discountBannerText(result)).toBe("10% off with SAVE10");
  });

  it("applies a fixed-amount coupon", () => {
    const result = applyProductCoupon(500, {
      couponId: "c2",
      code: "FLAT50",
      type: "FIXED_AMOUNT",
      value: 50,
    });
    expect(result.unitPrice).toBe(450);
    expect(result.discountAmount).toBe(50);
    expect(discountBannerText(result)).toBe("₹50 off with FLAT50");
  });

  it("does not go below zero for fixed discounts", () => {
    const result = applyProductCoupon(30, {
      couponId: "c3",
      code: "BIG",
      type: "FIXED_AMOUNT",
      value: 100,
    });
    expect(result.unitPrice).toBe(0);
    expect(result.hasDiscount).toBe(true);
  });
});

describe("formatWeightGrams", () => {
  it("formats grams and whole kilograms", () => {
    expect(formatWeightGrams(200)).toBe("200G");
    expect(formatWeightGrams(1000)).toBe("1KG");
    expect(formatWeightGrams(null)).toBeNull();
  });
});

describe("stockQtyBadgeClass", () => {
  it("maps quantity thresholds to badge colours", () => {
    expect(stockQtyBadgeClass(12)).toContain("green");
    expect(stockQtyBadgeClass(7)).toContain("yellow");
    expect(stockQtyBadgeClass(3)).toContain("red");
  });
});
