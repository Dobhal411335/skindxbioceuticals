"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { SiteCode } from "@/types/auth";

interface AdminTopbarProps {
  siteCode: SiteCode;
  title: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRefresh: () => void;
  mobileMenuSlot?: React.ReactNode;
}

export function AdminTopbar({
  siteCode,
  title,
  from,
  to,
  onFromChange,
  onToChange,
  onRefresh,
  mobileMenuSlot,
}: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Administrator";

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-start gap-3">
          <div className="md:hidden">{mobileMenuSlot}</div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{siteCode === "IN" ? "India · .in" : "Global · .com"}</Badge>
              <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
                <Link href="/select-site" className="hover:text-foreground">
                  Sites
                </Link>
                <span className="mx-1">/</span>
                <span className="text-foreground">{title}</span>
              </nav>
            </div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Review live statistics for the selected website.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            From
            <input
              type="date"
              value={from}
              onChange={(event) => onFromChange(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            To
            <input
              type="date"
              value={to}
              onChange={(event) => onToChange(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            />
          </label>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
            <div className="text-right">
              <p className="text-xs font-medium text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
