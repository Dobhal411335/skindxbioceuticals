"use client";

import { useEffect, useState } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar, type AdminTopbarProps } from "@/components/layout/admin-topbar";
import type { SiteCode } from "@/types/auth";

type TopbarExtras = Omit<
  AdminTopbarProps,
  "siteCode" | "title" | "mobileMenuSlot"
>;

interface AdminAppShellProps {
  siteCode: SiteCode;
  title: string;
  description?: string;
  children: React.ReactNode;
  topbar?: TopbarExtras;
}

/** Ref-counted so nested/overlapping shells do not unlock scroll early. */
let documentScrollLockCount = 0;
let savedHtmlOverflow: string | undefined;
let savedBodyOverflow: string | undefined;

function acquireDocumentScrollLock() {
  if (documentScrollLockCount === 0) {
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  documentScrollLockCount += 1;
}

function releaseDocumentScrollLock() {
  documentScrollLockCount = Math.max(0, documentScrollLockCount - 1);
  if (documentScrollLockCount === 0) {
    document.documentElement.style.overflow = savedHtmlOverflow ?? "";
    document.body.style.overflow = savedBodyOverflow ?? "";
    savedHtmlOverflow = undefined;
    savedBodyOverflow = undefined;
  }
}

export function AdminAppShell({
  siteCode,
  title,
  description,
  children,
  topbar,
}: AdminAppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Keep document scroll locked so only the main pane scrolls.
  useEffect(() => {
    acquireDocumentScrollLock();
    return () => {
      releaseDocumentScrollLock();
    };
  }, []);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-surface">
      <AdminSidebar
        siteCode={siteCode}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar
          siteCode={siteCode}
          title={title}
          description={description}
          {...topbar}
          mobileMenuSlot={
            <AdminSidebar
              siteCode={siteCode}
              collapsed={false}
              onCollapsedChange={() => undefined}
              variant="mobile"
            />
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 lg:px-6">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
