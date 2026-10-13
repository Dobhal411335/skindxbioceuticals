import type { PublicProductDetail } from "@/types/product";

export type ProductCoupon = NonNullable<PublicProductDetail["coupon"]>;

export type PricedUnit = {
  /** List / catalogue price in rupees. */
  originalPrice: number;
  /** Payable price after product coupon (same as original when no discount). */
  unitPrice: number;
  /** Absolute discount in rupees (0 when none). */
  discountAmount: number;
  coupon: ProductCoupon | null;
  hasDiscount: boolean;
};

/** Apply a product-linked coupon to a variant list price (rupees). */
export function applyProductCoupon(
  price: number,
  coupon: PublicProductDetail["coupon"],
): PricedUnit {
  if (!coupon || coupon.value <= 0 || price <= 0) {
    return {
      originalPrice: price,
      unitPrice: price,
      discountAmount: 0,
      coupon: null,
      hasDiscount: false,
    };
  }

  const type = coupon.type.toUpperCase();
  let unitPrice = price;

  if (type === "PERCENTAGE") {
    unitPrice = Math.max(0, price * (1 - coupon.value / 100));
  } else if (type === "FIXED_AMOUNT") {
    unitPrice = Math.max(0, price - coupon.value);
  } else {
    return {
      originalPrice: price,
      unitPrice: price,
      discountAmount: 0,
      coupon: null,
      hasDiscount: false,
    };
  }

  // Keep two decimal places for INR display; cart converts via rupeesToPaise.
  unitPrice = Math.round(unitPrice * 100) / 100;
  const discountAmount = Math.round((price - unitPrice) * 100) / 100;

  if (discountAmount <= 0) {
    return {
      originalPrice: price,
      unitPrice: price,
      discountAmount: 0,
      coupon: null,
      hasDiscount: false,
    };
  }

  return {
    originalPrice: price,
    unitPrice,
    discountAmount,
    coupon,
    hasDiscount: true,
  };
}

export function formatWeightGrams(grams: number | null | undefined): string | null {
  if (grams == null || grams <= 0) return null;
  if (grams >= 1000 && grams % 1000 === 0) {
    return `${grams / 1000}KG`;
  }
  return `${grams}G`;
}

export function stockQtyBadgeClass(quantity: number): string {
  if (quantity < 5) return "bg-red-100 text-red-800";
  if (quantity < 10) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export function discountBannerText(priced: PricedUnit): string | null {
  if (!priced.hasDiscount || !priced.coupon) return null;
  const type = priced.coupon.type.toUpperCase();
  const amountLabel =
    type === "PERCENTAGE"
      ? `${priced.coupon.value}% off`
      : `₹${priced.discountAmount} off`;
  return `${amountLabel} with ${priced.coupon.code}`;
}
