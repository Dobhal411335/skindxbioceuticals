"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Handshake, LayoutDashboard, LogOut, User } from "lucide-react";

import { UserAvatar } from "@/components/account/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDisplayName, isVendorUser } from "@/features/auth/auth-user";
import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { showSuccess } from "@/lib/toast";
import {
  clearAccountCartCache,
  clearGuestCart,
} from "@/lib/guest-cart-storage";
import { clearGuestWishlist } from "@/lib/guest-wishlist-storage";
import { clearCredentials } from "@/store/slices/authSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { clearWishlist } from "@/store/slices/wishlistSlice";

export function HeaderAccountMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const result = await authService.logout();
      dispatch(clearCredentials());
      dispatch(clearCart());
      dispatch(clearWishlist());
      clearGuestCart();
      clearAccountCartCache();
      clearGuestWishlist();
      setMobileOpen(false);
      showSuccess("Logged out successfully.", { id: "auth.logout.success" });
      if (!result.serverRevoked) {
        router.push("/?logout=partial");
        return;
      }
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="size-9 rounded-full" aria-label="Loading account" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="sm:hidden" asChild>
          <Link href="/vendor/login" aria-label="Vendor login">
            <Handshake className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/account/login" aria-label="Login or account">
            <User className="size-5" />
          </Link>
        </Button>
      </div>
    );
  }

  const isVendor = isVendorUser(user);
  const displayName = getUserDisplayName(user);
  // Vendors use the same account portal so they can view orders and addresses.
  const dashboardHref = "/account/dashboard";
  const dashboardLabel = "Dashboard";

  const profileSummary = (
    <div className="flex items-center gap-3 px-1 py-1">
      <UserAvatar user={user} size="xl" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          @{displayName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {isVendor && user.username ? (
            <>
              {user.email ? `${user.email}` : null}
            </>
          ) : (
            user.email
          )}
        </p>
        {isVendor ? (   
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c4820f]">
            Vendor partner
          </p>
        ) : null}
      </div>
    </div>
  );

  if (isNarrow) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={isVendor ? "Open vendor menu" : "Open account menu"}
          onClick={() => setMobileOpen(true)}
        >
          <UserAvatar user={user} />
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{isVendor ? "Vendor account" : "Account"}</DialogTitle>
            </DialogHeader>
            {profileSummary}
            <div className="mt-2 flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-2" asChild>
                <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="size-4" />
                  {dashboardLabel}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                <LogOut className="size-4" />
                {loggingOut ? "Signing out…" : "Log out"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={isVendor ? "Open vendor menu" : "Open account menu"}
        >
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">{profileSummary}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref}>
            <LayoutDashboard className="size-4" />
            {dashboardLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <LogOut className="size-4" />
          {loggingOut ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
