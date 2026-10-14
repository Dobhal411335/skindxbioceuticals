import { Prisma } from '@prisma/client';

/** Convert Decimal/number rupees to integer paise (Razorpay INR). */
export function rupeesToPaise(rupees: Prisma.Decimal | number | string): number {
  const value =
    typeof rupees === 'number'
      ? rupees
      : typeof rupees === 'string'
        ? Number(rupees)
        : Number(rupees.toString());
  if (!Number.isFinite(value)) {
    throw new Error('Invalid money amount');
  }
  return Math.round(value * 100);
}

/** Convert paise to rupees Decimal for Prisma money columns. */
export function paiseToRupeesDecimal(paise: number): Prisma.Decimal {
  return new Prisma.Decimal((paise / 100).toFixed(2));
}

export function decimalToString(value: { toString(): string } | number | string): string {
  return typeof value === 'string' ? value : value.toString();
}

export function decimalToNumber(value: Prisma.Decimal | number | string): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}
