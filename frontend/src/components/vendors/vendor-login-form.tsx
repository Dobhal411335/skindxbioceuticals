"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Handshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Handshake className="size-6 text-primary" aria-hidden />
        <h1 className="text-xl font-semibold">Vendor Login</h1>
      </div>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Enter your vendor credentials to view partner pricing.
      </p>

      <Separator className="mb-6" />

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
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
            className="h-11 rounded-full"
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
              className="h-11 rounded-full pr-11"
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
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
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
          className="font-medium text-[#f3a827] underline-offset-4 hover:underline"
        >
          Become a vendor
        </Link>
      </p>
    </div>
  );
}

export function VendorLoginForm() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md p-6">Loading…</div>}>
      <VendorLoginFormInner />
    </Suspense>
  );
}
