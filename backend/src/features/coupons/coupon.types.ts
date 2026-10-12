import type { CouponType } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type CouponDto = {
  id: string;
  siteCode: SiteCodeDto;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  amount: number | null;
  percent: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CouponRecord = {
  id: string;
  siteId: string;
  code: string;
  type: CouponType;
  value: { toString(): string } | number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CouponWrite = {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};
