"use client";

import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { CartWishlistSyncBridge } from "@/components/cart/cart-wishlist-sync-bridge";
import { env } from "@/config/env";
import { ToastHost } from "@/lib/toast";
import { StoreProvider } from "@/store/provider";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * App-wide client providers (auth store, Google OAuth, toasts).
 * Company basic info is loaded server-side in `(storefront)/layout.tsx`
 * and passed through `CompanyBasicInfoProvider` (navbar/footer/SEO consumers).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <StoreProvider>
        <AuthBootstrap />
        <CartWishlistSyncBridge />
        {children}
        <ToastHost />
      </StoreProvider>
    </GoogleOAuthProvider>
  );
}
