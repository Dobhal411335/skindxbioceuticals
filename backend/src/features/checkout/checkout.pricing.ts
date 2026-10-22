import type { CouponType, Prisma } from '@prisma/client';
import { decimalToNumber } from '@/lib/money';
import { resolveSellPrice } from '@/lib/vendor-pricing';

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
  cgstPercent: number;
  sgstPercent: number;
  taxRatePercent: number;
  /** CGST amount from original (list) line total. */
  lineCgst: number;
  /** SGST amount from original (list) line total. */
  lineSgst: number;
  lineTax: number;
};

type VariantForPricing = {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  vendorPrice?: Prisma.Decimal | null;
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
  options: { isVendor?: boolean } = {},
): PricedLine[] {
  const isVendor = Boolean(options.isVendor);
  return variants.map((variant) => {
    const quantity = quantities.get(variant.id) ?? 0;
    const listPrice = resolveSellPrice({
      price: variant.price,
      vendorPrice: variant.vendorPrice,
      isVendor,
    });
    const couponRow = variant.product.coupon?.coupon ?? null;
    // Vendors: no product coupons; GST applies on the partner payable unit.
    const priced = isVendor
      ? { unitPrice: listPrice, discountAmount: 0 }
      : applyProductCouponRupees(
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
    const originalUnitPrice = isVendor
      ? listPrice
      : compareAt != null && compareAt > priced.unitPrice
        ? Math.max(compareAt, listPrice)
        : listPrice;

    const cgstPercent = variant.product.tax
      ? decimalToNumber(variant.product.tax.cgst) ?? 0
      : 0;
    const sgstPercent = variant.product.tax
      ? decimalToNumber(variant.product.tax.sgst) ?? 0
      : 0;
    const taxRatePercent = cgstPercent + sgstPercent;
    const linePayableTotal = Math.round(priced.unitPrice * quantity * 100) / 100;
    const lineOriginalTotal = Math.round(originalUnitPrice * quantity * 100) / 100;
    // Tax on payable line for vendors; customers keep tax on original list total.
    const taxBaseTotal = isVendor ? linePayableTotal : lineOriginalTotal;
    const lineCgst = round2(taxBaseTotal * (cgstPercent / 100));
    const lineSgst = round2(taxBaseTotal * (sgstPercent / 100));
    const lineTax = round2(lineCgst + lineSgst);

    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku ?? `-`,
      quantity,
      originalUnitPrice,
      unitPrice: priced.unitPrice,
      lineOriginalTotal,
      linePayableTotal,
      discountAmount: Math.round((lineOriginalTotal - linePayableTotal) * 100) / 100,
      cgstPercent,
      sgstPercent,
      taxRatePercent,
      lineCgst,
      lineSgst,
      lineTax,
    };
  });
}

/**
 * CGST/SGST are computed from original (list) line totals and added on top of payable.
 */
export function sumCheckoutTotals(lines: PricedLine[]) {
  const subtotal = round2(lines.reduce((s, l) => s + l.lineOriginalTotal, 0));
  const payable = round2(lines.reduce((s, l) => s + l.linePayableTotal, 0));
  const discountTotal = round2(Math.max(0, subtotal - payable));
  const cgstTotal = round2(lines.reduce((s, l) => s + l.lineCgst, 0));
  const sgstTotal = round2(lines.reduce((s, l) => s + l.lineSgst, 0));
  const taxTotal = round2(cgstTotal + sgstTotal);
  const shippingTotal = 0;
  const grandTotal = round2(payable + taxTotal + shippingTotal);
  return {
    subtotal,
    discountTotal,
    cgstTotal,
    sgstTotal,
    taxTotal,
    shippingTotal,
    grandTotal,
    payable,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
