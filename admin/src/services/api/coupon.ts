import { apiClient } from "@/services/api/axios";
import { endpoints } from "@/services/api/endpoints";
import type { SiteCode } from "@/types/auth";
import type { CouponDto, CouponPayload } from "@/types/coupon";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export async function fetchCoupons(siteCode: SiteCode): Promise<CouponDto[]> {
  const { data } = await apiClient.get<ApiSuccess<CouponDto[]>>(
    endpoints.admin.coupons(siteCode),
  );
  return data.data;
}

export async function createCoupon(
  siteCode: SiteCode,
  body: CouponPayload,
): Promise<CouponDto> {
  const { data } = await apiClient.post<ApiSuccess<CouponDto>>(
    endpoints.admin.coupons(siteCode),
    body,
  );
  return data.data;
}

export async function updateCoupon(
  siteCode: SiteCode,
  couponId: string,
  body: CouponPayload,
): Promise<CouponDto> {
  const { data } = await apiClient.put<ApiSuccess<CouponDto>>(
    endpoints.admin.coupon(siteCode, couponId),
    body,
  );
  return data.data;
}

export async function patchCoupon(
  siteCode: SiteCode,
  couponId: string,
  body: { isActive: boolean },
): Promise<CouponDto> {
  const { data } = await apiClient.patch<ApiSuccess<CouponDto>>(
    endpoints.admin.coupon(siteCode, couponId),
    body,
  );
  return data.data;
}

export async function deleteCoupon(
  siteCode: SiteCode,
  couponId: string,
): Promise<void> {
  await apiClient.delete(endpoints.admin.coupon(siteCode, couponId));
}
