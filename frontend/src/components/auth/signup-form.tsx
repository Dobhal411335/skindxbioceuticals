"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

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

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
      router.push(
        `/account/verify-email?email=${encodeURIComponent(result.email)}`,
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
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Create an account</h1>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/">
            <X className="size-4" aria-hidden />
            Close
          </Link>
        </Button>
      </div>

      <Separator className="mb-6" />

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
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
            className="h-11 rounded-full"
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
              className="h-11 rounded-full pr-11"
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
              At least 12 characters with upper, lower, number, and special character.
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
              className="h-11 rounded-full pr-11"
              placeholder="Confirm your password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
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
          />
          <Label htmlFor="signup-terms" className="text-xs leading-snug font-normal">
            I agree with the Terms &amp; Conditions and Privacy Policy. Consent is
            required before any live account creation.
          </Label>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
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
          <div className="flex h-11 items-center justify-center rounded-full border text-sm text-muted-foreground">
            Loading Google…
          </div>
        }
      >
        <GoogleSignInButton text="signup_with" context="register" />
      </Suspense>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Google identity tokens are verified on the server before your session is created.
      </p>

      <Separator className="my-8" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/account/login"
          className="font-semibold text-foreground underline decoration-[#f3a827] decoration-2 underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
