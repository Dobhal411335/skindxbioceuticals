"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, UserRound, X } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/features/auth/auth.service";
import {
  getSafeRedirectPath,
  loginFormSchema,
} from "@/features/auth/auth.validation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { toApiError } from "@/services/api/errors";
import { setCredentials } from "@/store/slices/authSlice";

type LoginFormProps = {
  variant?: "page" | "panel";
};

function isEmailNotVerified(details: unknown): details is { code: string; email?: string } {
  return (
    typeof details === "object" &&
    details !== null &&
    "code" in details &&
    (details as { code: unknown }).code === "EMAIL_NOT_VERIFIED"
  );
}

function LoginFormInner({ variant = "page" }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.login(parsed.data);
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
        }),
      );
      router.replace(getSafeRedirectPath(searchParams.get("redirect")));
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.statusCode === 403 && isEmailNotVerified(apiError.details)) {
        const verifyEmail =
          typeof apiError.details.email === "string"
            ? apiError.details.email
            : parsed.data.email;
        router.push(
          `/account/verify-email?email=${encodeURIComponent(verifyEmail)}`,
        );
        return;
      }
      setFormError(apiError.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        variant === "page"
          ? "mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
          : "w-full"
      }
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {variant === "page" ? (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/">
              <X className="size-4" aria-hidden />
              Close
            </Link>
          </Button>
        ) : null}
      </div>

      <Separator className="mb-6" />

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-full"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="login-password"
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
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
          {fieldErrors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Log in"}
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" />
            <Label htmlFor="remember-me" className="font-normal">
              Remember me
            </Label>
          </div>
          <Link
            href="/account/forgot-password"
            className="text-[#f3a827] underline-offset-4 hover:underline"
          >
            Lost your password?
          </Link>
        </div>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          Or login with
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">

        <Suspense
          fallback={
            <div className="flex h-11 items-center justify-center rounded-full border text-sm text-muted-foreground">
              Loading Google…
            </div>
          }
        >
          <GoogleSignInButton text="signin_with" />
        </Suspense>
      </div>

      <Separator className="my-8" />

      <div className="flex flex-col items-center gap-2 text-center">
        <UserRound className="size-10 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">No account yet?</p>
        <Link
          href="/account/register"
          className="text-sm font-semibold tracking-wide uppercase underline decoration-[#f3a827] decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md p-6">Loading…</div>}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
