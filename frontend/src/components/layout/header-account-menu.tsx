"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, User } from "lucide-react";

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
import { getUserDisplayName } from "@/features/auth/auth-user";
import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
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
      setMobileOpen(false);
      if (!result.serverRevoked) {
        // Client session is cleared; surface a non-blocking notice via query for the home page.
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
      <Button variant="ghost" size="icon" asChild>
        <Link href="/account/login" aria-label="Login or account">
          <User className="size-5" />
        </Link>
      </Button>
    );
  }

  const displayName = getUserDisplayName(user);

  const profileSummary = (
    <div className="flex items-center gap-3 px-1 py-1">
      <UserAvatar user={user} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
          aria-label="Open account menu"
          onClick={() => setMobileOpen(true)}
        >
          <UserAvatar user={user} />
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Account</DialogTitle>
            </DialogHeader>
            {profileSummary}
            <div className="mt-2 flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-2" asChild>
                <Link href="/account/dashboard" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="size-4" />
                  Dashboard
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
          aria-label="Open account menu"
        >
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">{profileSummary}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
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
