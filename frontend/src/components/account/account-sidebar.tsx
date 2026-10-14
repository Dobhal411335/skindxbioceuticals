"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

import { UserAvatar } from "@/components/account/user-avatar";
import { accountNavItems } from "@/components/account/account-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getUserDisplayName } from "@/features/auth/auth-user";
import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { showSuccess } from "@/lib/toast";
import { clearGuestCart } from "@/lib/guest-cart-storage";
import { clearGuestWishlist } from "@/lib/guest-wishlist-storage";
import { clearCredentials } from "@/store/slices/authSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { clearWishlist } from "@/store/slices/wishlistSlice";
import { cn } from "@/lib/utils";

function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = getUserDisplayName(user);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      dispatch(clearCredentials());
      dispatch(clearCart());
      dispatch(clearWishlist());
      clearGuestCart();
      clearGuestWishlist();
      onNavigate?.();
      showSuccess("Logged out successfully.", { id: "auth.logout.success" });
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-5">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Account">
        {accountNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.action !== "logout" &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          if (item.action === "logout") {
            return (
              <button
                key={item.label}
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                <Icon className="size-4 shrink-0" />
                {loggingOut ? "Signing out…" : item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-surface",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AccountSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-full max-w-[280px] shrink-0 border-r border-border bg-background lg:block lg:w-[25%]">
        <SidebarNav />
      </aside>

      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="font-semibold text-foreground">My Account</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="size-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Account navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
