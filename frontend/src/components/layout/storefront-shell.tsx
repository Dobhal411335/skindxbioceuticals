"use client";

import type { ReactNode } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartUiProvider } from "@/components/cart/cart-ui-context";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <CartUiProvider>
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </CartUiProvider>
  );
}
