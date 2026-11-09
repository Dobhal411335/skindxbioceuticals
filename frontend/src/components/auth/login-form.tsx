"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { authService } from "@/features/auth/auth.service";
import {
  getSafeRedirectPath,
  loginFormSchema,
} from "@/features/auth/auth.validation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showInfo, showSuccess } from "@/lib/toast";
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

function LoginFormFields({
  isSubmitting,
  email,
  password,
  showPassword,
  fieldErrors,
  setEmail,
  setPassword,
  setShowPassword,
  onSubmit,
}: {
  isSubmitting: boolean;
  email: string;
  password: string;
  showPassword: boolean;
  fieldErrors: Record<string, string>;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
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
            className="h-11"
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
          {fieldErrors.password ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
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
        </div>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          Or login with
        </span>
        <Separator className="flex-1" />
      </div>
      <Suspense
        fallback={
          <div className="flex h-11 items-center justify-center rounded-lg border text-sm text-muted-foreground">
            Loading Google…
          </div>
        }
      >
        <GoogleSignInButton text="signin_with" context="login" />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/account/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const preset = searchParams.get("email");
    if (preset && preset.includes("@")) {
      setEmail(preset.trim().toLowerCase());
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      showSuccess("Signed in successfully.", { id: "auth.login.success" });
      router.replace(getSafeRedirectPath(searchParams.get("redirect")));
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.statusCode === 403 && isEmailNotVerified(apiError.details)) {
        const verifyEmail =
          typeof apiError.details.email === "string"
            ? apiError.details.email
            : parsed.data.email;
        showInfo("Please verify your email to continue.", {
          id: "auth.login.unverified",
        });
        router.push(
          `/account/verify-email?email=${encodeURIComponent(verifyEmail)}`,
        );
        return;
      }
      showError(
        getAuthErrorMessage(apiError, "Invalid email or password."),
        { id: "auth.login.error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = (
    <LoginFormFields
      isSubmitting={isSubmitting}
      email={email}
      password={password}
      showPassword={showPassword}
      fieldErrors={fieldErrors}
      setEmail={setEmail}
      setPassword={setPassword}
      setShowPassword={setShowPassword}
      onSubmit={(event) => void handleSubmit(event)}
    />
  );

  if (variant === "panel") {
    return <div className="w-full">{fields}</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden min-h-[28rem] self-stretch bg-surface lg:block">
        <Image
          src="/person/signup_login.webp"
          alt="SkinDx Bioceuticals customer account"
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
            Welcome back
          </p>
          <p className="mt-2 max-w-sm text-2xl leading-snug font-semibold tracking-tight">
            Sign in to manage orders, wishlist, and your SkinDx account.
          </p>
        </div>
      </aside>

      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="relative mb-6 overflow-hidden rounded-lg lg:hidden">
          <div className="relative aspect-[16/9]">
            <Image
              src="/person/signup_login.webp"
              alt="SkinDx Bioceuticals customer account"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and password to continue.
          </p>
        </div>

        {fields}
      </div>
    </div>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-border p-6">
          Loading…
        </div>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  );
}
