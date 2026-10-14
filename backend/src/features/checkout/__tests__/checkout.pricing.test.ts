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
  it('adds CGST/SGST from original line totals onto payable', () => {
    // Original 2000 @ 9%+9% → tax 360; payable 1800 → grand 2160
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
        cgstPercent: 9,
        sgstPercent: 9,
        taxRatePercent: 18,
        lineCgst: 180,
        lineSgst: 180,
        lineTax: 360,
      },
    ];
    const totals = sumCheckoutTotals(lines);
    expect(totals.subtotal).toBe(2000);
    expect(totals.discountTotal).toBe(200);
    expect(totals.cgstTotal).toBe(180);
    expect(totals.sgstTotal).toBe(180);
    expect(totals.taxTotal).toBe(360);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.payable).toBe(1800);
    expect(totals.grandTotal).toBe(2160);
  });
});
