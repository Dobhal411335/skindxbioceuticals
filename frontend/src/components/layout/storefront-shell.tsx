"use client";

import type { ReactNode } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartUiProvider } from "@/components/cart/cart-ui-context";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { GoogleTrackingTag } from "@/components/layout/google-tracking-tag";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchOverlay } from "@/components/search/search-overlay";
import { SearchUiProvider } from "@/components/search/search-ui-context";
import { PromoPopupBanner } from "@/components/shared/promo-popup-banner";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";

export function StorefrontShell({ children }: { children: ReactNode }) {
  const company = useCompanyBasicInfo();

  return (
    <CartUiProvider>
      <SearchUiProvider>
        <GoogleTrackingTag html={company.googleTrackingTag} />
        <AnnouncementBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CartDrawer />
        <SearchOverlay />
        <PromoPopupBanner />
      </SearchUiProvider>
    </CartUiProvider>
  );
}
