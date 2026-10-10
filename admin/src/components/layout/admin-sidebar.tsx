"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getSidebarConfig, type SidebarNavItem, type SidebarSection } from "@/config/sidebar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { SiteCode } from "@/types/auth";

interface AdminSidebarProps {
  siteCode: SiteCode;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /** desktop = collapsible aside; mobile = sheet trigger only */
  variant?: "desktop" | "mobile";
}

function NavItemRow({
  item,
  collapsed,
  onNavigate,
  onLogout,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const isActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
  const isPlanned = item.status === "planned";

  if (item.id === "logout") {
    return (
      <button
        type="button"
        onClick={() => {
          void onLogout();
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent",
          collapsed && "justify-center px-2",
        )}
        data-testid="sidebar-logout"
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed ? <span>Logout</span> : null}
      </button>
    );
  }

  if (isPlanned) {
    return (
      <div className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/55",
            collapsed && "justify-center px-2",
          )}
          title="Coming soon"
          data-testid={`nav-planned-${item.id}`}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed ? (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              <Badge variant="outline" className="border-white/20 text-[10px] text-sidebar-foreground/70">
                Soon
              </Badge>
            </>
          ) : null}
        </div>
        {!collapsed && item.children?.length ? (
          <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
            {item.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/45"
              >
                <span>{child.label}</span>
                <span>Soon</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Link
          href={item.href ?? "#"}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/90 hover:bg-sidebar-accent",
            collapsed && "justify-center px-2",
          )}
          data-testid={`nav-active-${item.id}`}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
        {!collapsed && item.children?.length ? (
          <button
            type="button"
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle submenu"
          >
            <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
          </button>
        ) : null}
      </div>
      {!collapsed && open && item.children?.length ? (
        <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
          {item.children.map((child) =>
            child.status === "planned" ? (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/45"
              >
                <span>{child.label}</span>
                <span>Soon</span>
              </div>
            ) : (
              <Link
                key={child.id}
                href={child.href ?? "#"}
                onClick={onNavigate}
                className="block rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent"
              >
                {child.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function SidebarBody({
  sections,
  collapsed,
  onNavigate,
  onLogout,
}: {
  sections: SidebarSection[];
  collapsed: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4" data-testid="admin-sidebar">
      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          {!collapsed && section.label ? (
            <p className="px-2.5 text-[11px] font-semibold tracking-wide text-sidebar-foreground/45 uppercase">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              onLogout={onLogout}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({
  siteCode,
  collapsed,
  onCollapsedChange,
  variant = "desktop",
}: AdminSidebarProps) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useMemo(() => getSidebarConfig(siteCode), [siteCode]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (variant === "mobile") {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Open menu">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
            <SheetTitle className="text-sidebar-foreground">SkinDx Bioc Admin</SheetTitle>
          </SheetHeader>
          <SidebarBody
            sections={sections}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold tracking-tight">SkinDx Bioc</p>
            <p className="text-xs text-sidebar-foreground/60">Admin · {siteCode}</p>
          </div>
        ) : (
          <span className="mx-auto text-sm font-semibold">SB</span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
      <Separator className="bg-sidebar-border" />
      <SidebarBody sections={sections} collapsed={collapsed} onLogout={handleLogout} />
      {!collapsed && user ? (
        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/60">
          Signed in as {user.email}
        </div>
      ) : null}
    </aside>
  );
}
