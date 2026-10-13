"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  filterSidebarForRole,
  getActiveAncestorIds,
  getSidebarConfig,
  type SidebarNavItem,
  type SidebarSection,
} from "@/config/sidebar";
import { useAuth } from "@/lib/auth-context";
import { showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { SiteCode } from "@/types/auth";

interface AdminSidebarProps {
  siteCode: SiteCode;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  variant?: "desktop" | "mobile";
}

function isPathActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  return pathname === href;
}

function NavLink({
  item,
  collapsed,
  onNavigate,
  nested = false,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isPathActive(pathname, item.href);

  return (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      title={item.label}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        nested ? "px-2.5 py-2 text-[13px]" : "px-2.5 py-2.5",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent",
        collapsed && !nested && "justify-center px-2",
      )}
      data-testid={`nav-${item.status}-${item.id}`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-90" />
      {!collapsed || nested ? <span className="min-w-0 flex-1 break-words">{item.label}</span> : null}
    </Link>
  );
}

function NavItemRow({
  item,
  collapsed,
  onNavigate,
  forcedOpen,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  forcedOpen: boolean;
}) {
  const pathname = usePathname();
  /** null = follow route; true/false = user override (allows closing the active section). */
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const Icon = item.icon;
  const parentActive = isPathActive(pathname, item.href);
  const childActive = item.children?.some((child) => isPathActive(pathname, child.href)) ?? false;
  const autoOpen = forcedOpen || childActive || parentActive;
  const open = manualOpen ?? autoOpen;

  useEffect(() => {
    // Reset override when the route changes so the active section can auto-expand again.
    setManualOpen(null);
  }, [pathname]);

  const toggleOpen = () => {
    setManualOpen(!(manualOpen ?? autoOpen));
  };

  if (item.children?.length) {
    const panelId = `sidebar-panel-${item.id}`;
    const groupActive = parentActive || childActive;

    return (
      <div className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg",
            groupActive && "bg-sidebar-primary text-sidebar-primary-foreground",
            !groupActive && "text-sidebar-foreground",
            collapsed && "justify-center",
          )}
        >
          {item.href ? (
            <Link
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                !groupActive && "hover:bg-sidebar-accent",
                collapsed && "justify-center px-2",
              )}
              data-testid={`nav-${item.status}-${item.id}`}
              aria-current={parentActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span className="min-w-0 flex-1 break-words">{item.label}</span> : null}
            </Link>
          ) : (
            <button
              type="button"
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                !groupActive && "hover:bg-sidebar-accent",
                collapsed && "justify-center px-2",
              )}
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls={panelId}
              data-testid={`nav-group-label-${item.id}`}
              title={item.label}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span className="min-w-0 flex-1 break-words">{item.label}</span> : null}
            </button>
          )}
          {!collapsed ? (
            <button
              type="button"
              className={cn(
                "rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                groupActive
                  ? "text-sidebar-primary-foreground/80 hover:bg-white/10"
                  : "text-sidebar-muted hover:bg-sidebar-accent",
              )}
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`Toggle ${item.label} submenu`}
              data-testid={`nav-group-${item.id}`}
            >
              <ChevronDown
                className={cn(
                  "admin-accordion-chevron size-4 shrink-0 transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </button>
          ) : null}
        </div>
        {!collapsed ? (
          <div
            id={panelId}
            className={cn(
              "admin-accordion-panel grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="ml-3 space-y-0.5 border-l border-sidebar-border py-1 pl-2">
                {item.children.map((child) =>
                  child.href ? (
                    <NavLink
                      key={child.id}
                      item={child}
                      collapsed={false}
                      onNavigate={onNavigate}
                      nested
                    />
                  ) : null,
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) {
    return null;
  }

  return <NavLink item={item} collapsed={collapsed} onNavigate={onNavigate} />;
}

function SidebarBody({
  sections,
  collapsed,
  onNavigate,
  activeAncestorIds,
}: {
  sections: SidebarSection[];
  collapsed: boolean;
  onNavigate?: () => void;
  activeAncestorIds: string[];
}) {
  return (
    <nav
      className="admin-sidebar-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-4"
      data-testid="admin-sidebar"
    >
      {sections.map((section) => (
        <div key={section.id} className="space-y-1.5">
          {!collapsed && section.label ? (
            <p className="px-2.5 text-[11px] font-semibold tracking-[0.14em] text-sidebar-muted uppercase">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              forcedOpen={activeAncestorIds.includes(item.id)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarLogoutFooter({
  collapsed,
  onLogout,
}: {
  collapsed: boolean;
  onLogout: () => void;
}) {
  const { user } = useAuth();

  return (
    <div
      className={cn("shrink-0 border-t border-sidebar-border px-3 py-3", collapsed && "px-2")}
      data-testid="sidebar-footer"
    >
      {!collapsed && user ? (
        <p className="mb-2 truncate px-1 text-[11px] text-sidebar-muted" title={user.email}>
          {user.email}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          void onLogout();
        }}
        title="User Logout"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "justify-center px-2",
        )}
        data-testid="sidebar-logout"
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed ? <span>User Logout</span> : null}
      </button>
    </div>
  );
}

export function AdminSidebar({
  siteCode,
  collapsed,
  onCollapsedChange,
  variant = "desktop",
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useMemo(
    () => filterSidebarForRole(getSidebarConfig(siteCode), user?.role),
    [siteCode, user?.role],
  );
  const activeAncestorIds = useMemo(
    () => getActiveAncestorIds(siteCode, pathname),
    [siteCode, pathname],
  );

  async function handleLogout() {
    await logout();
    showSuccess("Signed out successfully.", { id: "admin.auth.logout.success" });
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
        <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
            <SheetTitle className="text-sidebar-foreground">SkinDx Bioc Admin</SheetTitle>
          </SheetHeader>
          <SidebarBody
            sections={sections}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            activeAncestorIds={activeAncestorIds}
          />
          <SidebarLogoutFooter collapsed={false} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-72",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-4">
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">SkinDx Bioc</p>
            <p className="text-xs text-sidebar-muted">Admin · {siteCode}</p>
          </div>
        ) : (
          <span className="mx-auto text-sm font-semibold" title="SkinDx Bioc">
            SB
          </span>
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
      <Separator className="shrink-0 bg-sidebar-border" />
      <SidebarBody
        sections={sections}
        collapsed={collapsed}
        activeAncestorIds={activeAncestorIds}
      />
      <SidebarLogoutFooter collapsed={collapsed} onLogout={handleLogout} />
    </aside>
  );
}
