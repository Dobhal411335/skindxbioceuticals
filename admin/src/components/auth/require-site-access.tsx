"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import type { SiteCode } from "@/types/auth";

export function RequireSiteAccess({
  siteCode,
  children,
}: {
  siteCode: SiteCode;
  children: React.ReactNode;
}) {
  const { hasSiteAccess, isLoading } = useAuth();
  const router = useRouter();
  const allowed = hasSiteAccess(siteCode);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/select-site");
    }
  }, [allowed, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Verifying site access…
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
