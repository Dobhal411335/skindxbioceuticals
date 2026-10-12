import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { CouponRecord, CouponWrite } from './coupon.types';

function mapCoupon(row: {
  id: string;
  siteId: string;
  code: string;
  type: CouponRecord['type'];
  value: Prisma.Decimal | number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CouponRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    code: row.code,
    type: row.type,
    value: row.value,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CouponRepository {
  async listBySiteId(siteId: string): Promise<CouponRecord[]> {
    const rows = await prisma.coupon.findMany({
      where: { siteId },
      orderBy: [{ createdAt: 'desc' }, { code: 'asc' }],
    });
    return rows.map(mapCoupon);
  }

  async findByIdForSite(siteId: string, couponId: string): Promise<CouponRecord | null> {
    const row = await prisma.coupon.findFirst({
      where: { id: couponId, siteId },
    });
    return row ? mapCoupon(row) : null;
  }

  async findByCodeForSite(siteId: string, code: string): Promise<CouponRecord | null> {
    const row = await prisma.coupon.findFirst({
      where: { siteId, code },
    });
    return row ? mapCoupon(row) : null;
  }

  async create(siteId: string, data: CouponWrite): Promise<CouponRecord> {
    const row = await prisma.coupon.create({
      data: {
        siteId,
        code: data.code,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: data.isActive,
      },
    });
    return mapCoupon(row);
  }

  async update(
    siteId: string,
    couponId: string,
    data: CouponWrite,
  ): Promise<CouponRecord | null> {
    const existing = await prisma.coupon.findFirst({
      where: { id: couponId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: data.code,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: data.isActive,
      },
    });
    return mapCoupon(row);
  }

  async patch(
    siteId: string,
    couponId: string,
    data: { isActive: boolean },
  ): Promise<CouponRecord | null> {
    const existing = await prisma.coupon.findFirst({
      where: { id: couponId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: data.isActive },
    });
    return mapCoupon(row);
  }

  async countProductLinks(couponId: string): Promise<number> {
    return prisma.productCoupon.count({ where: { couponId } });
  }

  async delete(siteId: string, couponId: string): Promise<boolean> {
    const existing = await prisma.coupon.findFirst({
      where: { id: couponId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.coupon.delete({ where: { id: couponId } });
    return true;
  }
}

export const couponRepository = new CouponRepository();
