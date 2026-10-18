import type { Prisma } from '@prisma/client';
import { decimalToNumber } from '@/lib/money';

/**
 * Resolve the sellable unit price for a variant.
 * Vendors pay `vendorPrice` when set; otherwise fall back to B2C `price`.
 */
export function resolveSellPrice(input: {
  price: Prisma.Decimal | number;
  vendorPrice?: Prisma.Decimal | number | null;
  isVendor: boolean;
}): number {
  const b2c = typeof input.price === 'number' ? input.price : decimalToNumber(input.price) ?? 0;
  if (!input.isVendor) {
    return b2c;
  }
  const vendor =
    input.vendorPrice == null
      ? null
      : typeof input.vendorPrice === 'number'
        ? input.vendorPrice
        : decimalToNumber(input.vendorPrice);
  return vendor ?? b2c;
}
