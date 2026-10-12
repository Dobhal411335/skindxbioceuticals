import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { couponRepository } from './coupon.repository';
import type {
  CouponBody,
  CouponPatchBody,
} from './coupon.validation';
import {
  parseDateOnlyEnd,
  parseDateOnlyStart,
  toDateOnly,
} from './coupon.validation';
import type {
  CouponDto,
  CouponRecord,
  CouponWrite,
  SiteCodeDto,
} from './coupon.types';

function decimalToNumber(value: { toString(): string } | number): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

export function toCouponDto(record: CouponRecord, siteCode: SiteCodeDto): CouponDto {
  const value = decimalToNumber(record.value);
  const isPercent = record.type === 'PERCENTAGE';
  const isAmount = record.type === 'FIXED_AMOUNT';

  if (!isPercent && !isAmount) {
    throw new ValidationError('Unsupported coupon type for admin management');
  }

  return {
    id: record.id,
    siteCode,
    code: record.code,
    type: isPercent ? 'PERCENTAGE' : 'FIXED_AMOUNT',
    value,
    amount: isAmount ? value : null,
    percent: isPercent ? value : null,
    startsAt: toDateOnly(record.startsAt),
    endsAt: toDateOnly(record.endsAt),
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function bodyToWrite(body: CouponBody): CouponWrite {
  const hasAmount = body.amount !== null && body.amount !== undefined;
  return {
    code: body.code,
    type: hasAmount ? 'FIXED_AMOUNT' : 'PERCENTAGE',
    value: hasAmount ? (body.amount as number) : (body.percent as number),
    startsAt: parseDateOnlyStart(body.startsAt),
    endsAt: parseDateOnlyEnd(body.endsAt),
    isActive: body.isActive,
  };
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export class CouponService {
  constructor(private readonly repository = couponRepository) {}

  async listForSite(siteId: string, siteCode: SiteCode): Promise<CouponDto[]> {
    const rows = await this.repository.listBySiteId(siteId);
    return rows
      .filter((row) => row.type === 'PERCENTAGE' || row.type === 'FIXED_AMOUNT')
      .map((row) => toCouponDto(row, siteCode));
  }

  async createForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CouponBody;
  }): Promise<CouponDto> {
    const data = bodyToWrite(input.body);
    const existing = await this.repository.findByCodeForSite(input.siteId, data.code);
    if (existing) {
      throw new ConflictError('A coupon with this code already exists for this site');
    }

    try {
      const record = await this.repository.create(input.siteId, data);
      logger.info(
        {
          event: 'coupon.created',
          siteCode: input.siteCode,
          userId: input.userId,
          couponId: record.id,
          type: record.type,
        },
        'Coupon created',
      );
      return toCouponDto(record, input.siteCode);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictError('A coupon with this code already exists for this site');
      }
      throw error;
    }
  }

  async updateForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    couponId: string;
    body: CouponBody;
  }): Promise<CouponDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.couponId);
    if (!existing) {
      throw new NotFoundError('Coupon not found');
    }

    const data = bodyToWrite(input.body);
    if (data.code !== existing.code) {
      const conflict = await this.repository.findByCodeForSite(input.siteId, data.code);
      if (conflict && conflict.id !== input.couponId) {
        throw new ConflictError('A coupon with this code already exists for this site');
      }
    }

    try {
      const record = await this.repository.update(input.siteId, input.couponId, data);
      if (!record) {
        throw new NotFoundError('Coupon not found');
      }

      logger.info(
        {
          event: 'coupon.updated',
          siteCode: input.siteCode,
          userId: input.userId,
          couponId: record.id,
          type: record.type,
        },
        'Coupon updated',
      );
      return toCouponDto(record, input.siteCode);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictError('A coupon with this code already exists for this site');
      }
      throw error;
    }
  }

  async patchForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    couponId: string;
    body: CouponPatchBody;
  }): Promise<CouponDto> {
    const record = await this.repository.patch(input.siteId, input.couponId, input.body);
    if (!record) {
      throw new NotFoundError('Coupon not found');
    }

    logger.info(
      {
        event: 'coupon.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        couponId: record.id,
        isActive: record.isActive,
      },
      'Coupon patched',
    );

    return toCouponDto(record, input.siteCode);
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    couponId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.couponId);
    if (!existing) {
      throw new NotFoundError('Coupon not found');
    }

    const linkedProducts = await this.repository.countProductLinks(input.couponId);
    if (linkedProducts > 0) {
      throw new ConflictError(
        'Cannot delete a coupon that is assigned to one or more products',
      );
    }

    const deleted = await this.repository.delete(input.siteId, input.couponId);
    if (!deleted) {
      throw new NotFoundError('Coupon not found');
    }

    logger.info(
      {
        event: 'coupon.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        couponId: input.couponId,
      },
      'Coupon deleted',
    );
  }
}

export const couponService = new CouponService();
