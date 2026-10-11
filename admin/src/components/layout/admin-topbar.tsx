"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBreadcrumbs } from "@/config/sidebar";
import { useAuth } from "@/lib/auth-context";
import { showSuccess } from "@/lib/toast";
import type { SiteCode } from "@/types/auth";

export interface AdminTopbarProps {
  siteCode: SiteCode;
  title: string;
  description?: string;
  from?: string;
  to?: string;
  onFromChange?: (value: string) => void;
  onToChange?: (value: string) => void;
  onRefresh?: () => void;
  mobileMenuSlot?: React.ReactNode;
}

export function AdminTopbar({
  siteCode,
  title,
  description,
  from,
  to,
  onFromChange,
  onToChange,
  onRefresh,
  mobileMenuSlot,
}: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(siteCode, pathname);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Administrator";

  const showDateControls =
    typeof from === "string" &&
    typeof to === "string" &&
    typeof onFromChange === "function" &&
    typeof onToChange === "function" &&
    typeof onRefresh === "function";

  async function handleLogout() {
    await logout();
    showSuccess("Signed out successfully.", { id: "admin.auth.logout.success" });
    router.replace("/login");
  }

  return (
    <header className="z-20 shrink-0 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-start gap-3">
          <div className="md:hidden">{mobileMenuSlot}</div>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{siteCode === "IN" ? "India · .in" : "India · .com"}</Badge>
              <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                      {index > 0 ? <span aria-hidden>/</span> : null}
                      {crumb.href && !isLast ? (
                        <Link href={crumb.href} className="hover:text-foreground">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? "text-foreground" : undefined}>{crumb.label}</span>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description ??
                (showDateControls
                  ? "Review live statistics for the selected website."
                  : "Site-scoped administration for the selected website.")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showDateControls ? (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                From
                <input
                  type="date"
                  value={from}
                  onChange={(event) => onFromChange(event.target.value)}
                  className="h-9 rounded-[10px] border border-input bg-background px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                To
                <input
                  type="date"
                  value={to}
                  onChange={(event) => onToChange(event.target.value)}
                  className="h-9 rounded-[10px] border border-input bg-background px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              </label>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </>
          ) : null}
          <div className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-2.5 py-1.5">
            <div className="text-right">
              <p className="text-xs font-medium text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role?.replaceAll("_", " ")}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={() => void handleLogout()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
