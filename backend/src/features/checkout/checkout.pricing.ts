import type { CouponType, Prisma } from '@prisma/client';
import { decimalToNumber } from '@/lib/money';

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  /** List / original unit price in rupees. */
  originalUnitPrice: number;
  /** Payable unit price after product coupon in rupees. */
  unitPrice: number;
  lineOriginalTotal: number;
  linePayableTotal: number;
  discountAmount: number;
  taxRatePercent: number;
  lineTax: number;
};

type VariantForPricing = {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  product: {
    id: string;
    name: string;
    status: string;
    tax: { cgst: Prisma.Decimal; sgst: Prisma.Decimal } | null;
    coupon: {
      coupon: {
        code: string;
        type: CouponType;
        value: Prisma.Decimal;
        isActive: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
      };
    } | null;
  };
};

/** Apply product-linked coupon to a list price (rupees). Mirrors storefront applyProductCoupon. */
export function applyProductCouponRupees(
  listPrice: number,
  coupon: {
    type: CouponType | string;
    value: number;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  } | null,
): { unitPrice: number; discountAmount: number } {
  if (!coupon || !coupon.isActive || coupon.value <= 0 || listPrice <= 0) {
    return { unitPrice: listPrice, discountAmount: 0 };
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { unitPrice: listPrice, discountAmount: 0 };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { unitPrice: listPrice, discountAmount: 0 };
  }

  const type = String(coupon.type).toUpperCase();
  let unitPrice = listPrice;
  if (type === 'PERCENTAGE') {
    unitPrice = Math.max(0, listPrice * (1 - coupon.value / 100));
  } else if (type === 'FIXED_AMOUNT') {
    unitPrice = Math.max(0, listPrice - coupon.value);
  } else {
    return { unitPrice: listPrice, discountAmount: 0 };
  }

  unitPrice = Math.round(unitPrice * 100) / 100;
  const discountAmount = Math.round((listPrice - unitPrice) * 100) / 100;
  if (discountAmount <= 0) {
    return { unitPrice: listPrice, discountAmount: 0 };
  }
  return { unitPrice, discountAmount };
}

export function priceCheckoutLines(
  variants: VariantForPricing[],
  quantities: Map<string, number>,
): PricedLine[] {
  return variants.map((variant) => {
    const quantity = quantities.get(variant.id) ?? 0;
    const listPrice = decimalToNumber(variant.price);
    const couponRow = variant.product.coupon?.coupon ?? null;
    const priced = applyProductCouponRupees(
      listPrice,
      couponRow
        ? {
            type: couponRow.type,
            value: decimalToNumber(couponRow.value),
            isActive: couponRow.isActive,
            startsAt: couponRow.startsAt,
            endsAt: couponRow.endsAt,
          }
        : null,
    );

    // Original for display: prefer compare-at when higher than list, else list before coupon.
    const compareAt = variant.compareAtPrice
      ? decimalToNumber(variant.compareAtPrice)
      : null;
    const originalUnitPrice =
      compareAt != null && compareAt > priced.unitPrice
        ? Math.max(compareAt, listPrice)
        : listPrice;

    const cgst = variant.product.tax ? decimalToNumber(variant.product.tax.cgst) : 0;
    const sgst = variant.product.tax ? decimalToNumber(variant.product.tax.sgst) : 0;
    const taxRatePercent = cgst + sgst;
    const linePayableTotal = Math.round(priced.unitPrice * quantity * 100) / 100;
    const lineOriginalTotal = Math.round(originalUnitPrice * quantity * 100) / 100;
    const lineTax =
      taxRatePercent > 0
        ? Math.round(linePayableTotal * (taxRatePercent / 100) * 100) / 100
        : 0;

    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku ?? `VAR-${variant.id.slice(0, 8)}`,
      quantity,
      originalUnitPrice,
      unitPrice: priced.unitPrice,
      lineOriginalTotal,
      linePayableTotal,
      discountAmount: Math.round((lineOriginalTotal - linePayableTotal) * 100) / 100,
      taxRatePercent,
      lineTax,
    };
  });
}

export function sumCheckoutTotals(lines: PricedLine[]) {
  const subtotal = round2(lines.reduce((s, l) => s + l.lineOriginalTotal, 0));
  const payable = round2(lines.reduce((s, l) => s + l.linePayableTotal, 0));
  const discountTotal = round2(Math.max(0, subtotal - payable));
  const taxTotal = round2(lines.reduce((s, l) => s + l.lineTax, 0));
  const shippingTotal = 0;
  const grandTotal = round2(payable + taxTotal + shippingTotal);
  return { subtotal, discountTotal, taxTotal, shippingTotal, grandTotal, payable };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
