"use client";

import { isVendorUser } from "@/features/auth/auth-user";
import { useAuth } from "@/hooks/useAuth";

/** True when the current storefront session is an approved VENDOR partner. */
export function useIsVendor(): boolean {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && isVendorUser(user);
}
