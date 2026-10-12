import type { SiteCode } from "@/types/auth";

export type CouponDto = {
  id: string;
  siteCode: SiteCode;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  amount: number | null;
  percent: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CouponFormValues = {
  code: string;
  amount: string;
  percent: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type CouponPayload = {
  code: string;
  amount: number | null;
  percent: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};
