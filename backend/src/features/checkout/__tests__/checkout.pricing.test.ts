import { applyProductCouponRupees, sumCheckoutTotals } from '../checkout.pricing';
import type { PricedLine } from '../checkout.pricing';

describe('applyProductCouponRupees', () => {
  it('applies percentage coupons', () => {
    const result = applyProductCouponRupees(1000, {
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      startsAt: null,
      endsAt: null,
    });
    expect(result.unitPrice).toBe(900);
    expect(result.discountAmount).toBe(100);
  });

  it('ignores inactive coupons', () => {
    const result = applyProductCouponRupees(500, {
      type: 'PERCENTAGE',
      value: 50,
      isActive: false,
      startsAt: null,
      endsAt: null,
    });
    expect(result.unitPrice).toBe(500);
    expect(result.discountAmount).toBe(0);
  });
});

describe('sumCheckoutTotals', () => {
  it('computes original subtotal, discount, tax and grand total', () => {
    const lines: PricedLine[] = [
      {
        variantId: 'v1',
        productId: 'p1',
        productName: 'Serum',
        variantName: '30ml',
        sku: 'S-30',
        quantity: 2,
        originalUnitPrice: 1000,
        unitPrice: 900,
        lineOriginalTotal: 2000,
        linePayableTotal: 1800,
        discountAmount: 200,
        taxRatePercent: 18,
        lineTax: 324,
      },
    ];
    const totals = sumCheckoutTotals(lines);
    expect(totals.subtotal).toBe(2000);
    expect(totals.discountTotal).toBe(200);
    expect(totals.taxTotal).toBe(324);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.grandTotal).toBe(2124);
  });
});
