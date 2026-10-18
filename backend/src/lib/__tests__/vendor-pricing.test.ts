import { Prisma } from '@prisma/client';
import { resolveSellPrice } from '../vendor-pricing';

describe('resolveSellPrice', () => {
  it('returns B2C price for non-vendors', () => {
    expect(
      resolveSellPrice({
        price: new Prisma.Decimal('100.00'),
        vendorPrice: new Prisma.Decimal('70.00'),
        isVendor: false,
      }),
    ).toBe(100);
  });

  it('returns vendor price for vendors when set', () => {
    expect(
      resolveSellPrice({
        price: new Prisma.Decimal('100.00'),
        vendorPrice: new Prisma.Decimal('70.00'),
        isVendor: true,
      }),
    ).toBe(70);
  });

  it('falls back to B2C when vendor price is null', () => {
    expect(
      resolveSellPrice({
        price: 100,
        vendorPrice: null,
        isVendor: true,
      }),
    ).toBe(100);
  });
});
