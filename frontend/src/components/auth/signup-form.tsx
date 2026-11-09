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
import { registerFormSchema } from "@/features/auth/auth.validation";
import { showError, showInfo } from "@/lib/toast";

function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      showError("Please accept the Terms & Conditions to continue.", {
        id: "auth.signup.terms",
      });
      return;
    }

    const parsed = registerFormSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

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
      const result = await authService.register(parsed.data);
      showInfo("Check your email for a verification code.", {
        id: "auth.signup.success",
        description: "Enter the code on the next screen to join SkinDx Bioceuticals.",
      });
      router.push(
        `/account/verify-email?email=${encodeURIComponent(result.email)}&from=signup`,
      );
    } catch (error) {
      showError(
        getAuthErrorMessage(
          error,
          "Unable to create your account. Please try again.",
        ),
        { id: "auth.signup.error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden min-h-[32rem] self-stretch bg-surface lg:block">
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
            Join SkinDx
          </p>
          <p className="mt-2 max-w-sm text-2xl leading-snug font-semibold tracking-tight">
            Create your account to shop, track orders, and save favourites.
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
            Create an account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Fill in your details to get started with SkinDx Bioceuticals.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="signup-name">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
              className="h-11"
              placeholder="Your name"
            />
            {fieldErrors.name ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">
              Email address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-email"
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
            <Label htmlFor="signup-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="h-11 pr-11"
                placeholder="Create a password"
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
            ) : (
              <p className="text-xs text-muted-foreground">
                At least 12 characters with upper, lower, number, and special
                character.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">
              Confirm password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
                className="h-11 pr-11"
                placeholder="Confirm your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="signup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <Label
              htmlFor="signup-terms"
              className="block text-xs leading-relaxed font-normal"
            >
              <span className="block">
                I agree with the{" "}
                <Link
                  href="/terms-conditions-skindx-bioceuticals-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy-skindx-bioceuticals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                .
              </span>
              <span className="mt-0.5 block text-muted-foreground">
                Consent is required before any live account creation.
              </span>
            </Label>
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs tracking-wide text-muted-foreground uppercase">
            Or sign up with
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
          <GoogleSignInButton text="signup_with" context="register" />
        </Suspense>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Google identity tokens are verified on the server before your session
          is created.
        </p>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignupForm() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-border p-6">
          Loading…
        </div>
      }
    >
      <SignupFormInner />
    </Suspense>
  );
}
