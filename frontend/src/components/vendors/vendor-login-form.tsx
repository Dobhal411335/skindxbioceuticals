"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Handshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { getSafeRedirectPath } from "@/features/auth/auth.validation";
import { authService } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import {
  clearAccountCartCache,
  clearGuestCart,
} from "@/lib/guest-cart-storage";
import { clearGuestWishlist } from "@/lib/guest-wishlist-storage";
import { showError, showSuccess } from "@/lib/toast";
import { toApiError } from "@/services/api/errors";
import { clearCredentials, setCredentials } from "@/store/slices/authSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { clearWishlist } from "@/store/slices/wishlistSlice";

function VendorLoginFormInner() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      showError("Enter username and password.", { id: "vendor.login.validation" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Switch off any Google/customer session before vendor login.
      if (isAuthenticated) {
        try {
          await authService.logout();
        } catch {
          // Client clear still proceeds so vendor login can replace the token.
        }
        dispatch(clearCredentials());
        dispatch(clearCart());
        dispatch(clearWishlist());
        clearGuestCart();
        clearAccountCartCache();
        clearGuestWishlist();
      }

      const data = await authService.vendorLogin({
        username: username.trim(),
        password,
      });
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
        }),
      );
      showSuccess("Signed in as vendor.", { id: "vendor.login.success" });
      router.replace(getSafeRedirectPath(searchParams.get("redirect") ?? "/"));
    } catch (error) {
      const apiError = toApiError(error);
      showError(getAuthErrorMessage(apiError, "Invalid username or password."), {
        id: "vendor.login.error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden min-h-[28rem] self-stretch bg-surface lg:block">
        <Image
          src="/person/vendor_login.webp"
          alt="SkinDx Bioceuticals vendor partnership"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#17191c]/55 via-[#17191c]/15 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <p className="text-sm font-semibold tracking-[0.16em] text-white/80 uppercase">
            Vendor portal
          </p>
          <p className="mt-2 max-w-sm text-2xl leading-snug font-semibold tracking-tight">
            Sign in to access partner pricing and your vendor account.
          </p>
        </div>
      </aside>

      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="relative mb-6 overflow-hidden rounded-lg lg:hidden">
          <div className="relative aspect-[16/9]">
            <Image
              src="/person/vendor_login.webp"
              alt="SkinDx Bioceuticals vendor partnership"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Handshake className="size-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Vendor Login
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your vendor credentials to view partner pricing.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="vendor-username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vendor-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              className="h-11"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="vendor-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="h-11 pr-11"
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/become-vendor"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Become a vendor
          </Link>
        </p>
      </div>
    </div>
  );
}

export function VendorLoginForm() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-border p-6">
          Loading…
        </div>
      }
    >
      <VendorLoginFormInner />
    </Suspense>
  );
}
