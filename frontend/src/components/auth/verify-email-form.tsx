"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { authService } from "@/features/auth/auth.service";
import {
  getSafeRedirectPath,
  verifyEmailFormSchema,
} from "@/features/auth/auth.validation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { setCredentials } from "@/store/slices/authSlice";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailFormInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email")?.trim() ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = verifyEmailFormSchema.safeParse({ email, otp });
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
      const data = await authService.verifyEmail(parsed.data);
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
        }),
      );
      showSuccess("Email verified successfully.", { id: "auth.verify.success" });
      router.replace(getSafeRedirectPath(searchParams.get("redirect")));
    } catch (error) {
      showError(
        getAuthErrorMessage(
          error,
          "Unable to verify this code. Please try again.",
        ),
        { id: "auth.verify.error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) {
      showInfo(`Please wait ${cooldown}s before requesting another code.`, {
        id: "auth.verify.resend.cooldown",
      });
      return;
    }

    const emailCheck = verifyEmailFormSchema.shape.email.safeParse(email);
    if (!emailCheck.success) {
      setFieldErrors({ email: emailCheck.error.issues[0]?.message ?? "Enter a valid email" });
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification({ email: emailCheck.data });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showInfo(
        "If an unverified account exists for this email, a new code has been sent.",
        { id: "auth.verify.resend.success" },
      );
    } catch (error) {
      showError(
        getAuthErrorMessage(error, "Unable to resend the code right now."),
        { id: "auth.verify.resend.error" },
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/">
            <X className="size-4" aria-hidden />
            Close
          </Link>
        </Button>
      </div>

      <Separator className="mb-6" />

      <p className="mb-5 text-sm text-muted-foreground">
        Enter the verification code we sent to your email. Do not share this code with
        anyone.
      </p>

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="verify-email">
            Email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="verify-email"
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
          <Label htmlFor="verify-otp">
            Verification code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="verify-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\s/g, ""))}
            disabled={isSubmitting}
            className="h-11 rounded-full tracking-[0.3em]"
            placeholder="••••••"
            maxLength={8}
          />
          {fieldErrors.otp ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.otp}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <Button
          type="button"
          variant="ghost"
          disabled={isResending || cooldown > 0}
          onClick={() => void handleResend()}
        >
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : isResending
              ? "Sending…"
              : "Resend verification code"}
        </Button>
        <Link
          href="/account/login"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md p-6">Loading…</div>}>
      <VerifyEmailFormInner />
    </Suspense>
  );
}
