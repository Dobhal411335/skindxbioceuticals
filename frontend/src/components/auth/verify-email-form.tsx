"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { CheckCircle2, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { getUserDisplayName } from "@/features/auth/auth-user";
import { authService } from "@/features/auth/auth.service";
import {
  getSafeRedirectPath,
  verifyEmailFormSchema,
} from "@/features/auth/auth.validation";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { setCredentials } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

function WelcomeVerifiedPanel({
  user,
  redirectPath,
  onContinue,
}: {
  user: AuthUser;
  redirectPath: string;
  onContinue: () => void;
}) {
  const displayName = getUserDisplayName(user);
  const firstName =
    typeof user.firstName === "string" && user.firstName.trim()
      ? user.firstName.trim()
      : null;

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 text-center shadow-sm sm:p-8">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#f3a827]/15 text-[#c98912]">
        <CheckCircle2 className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Welcome to SkinDx Bioceuticals
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Your email is verified
        {displayName && !firstName ? ` for ${displayName}` : ""}. You&apos;re all
        set to explore clinician-trusted skincare and manage your account.
      </p>
      <Button
        type="button"
        className="mt-7 h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
        size="lg"
        onClick={onContinue}
      >
        Continue shopping
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Or go to{" "}
        <Link
          href={redirectPath === "/" ? "/account/dashboard" : redirectPath}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          your account
        </Link>
      </p>
    </div>
  );
}

function VerifyEmailFormInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: sessionUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const initialEmail = searchParams.get("email")?.trim() ?? "";
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null);

  // Prefer just-verified local state; after refresh, restore from the authenticated session.
  const welcomeUser = verifiedUser ?? (isAuthenticated ? sessionUser : null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
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
      setVerifiedUser(data.user);
      showSuccess("Welcome to SkinDx Bioceuticals!", {
        id: "auth.verify.success",
        description: "Your email is verified. Enjoy exploring our products.",
      });
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

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    if (fieldErrors.otp) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.otp;
        return next;
      });
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
      setOtp("");
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

  if (isAuthLoading && !welcomeUser) {
    return (
      <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-xl border border-border bg-background p-10 text-sm text-muted-foreground shadow-sm">
        Checking session…
      </div>
    );
  }

  if (welcomeUser) {
    return (
      <WelcomeVerifiedPanel
        user={welcomeUser}
        redirectPath={redirectPath}
        onContinue={() => router.replace(redirectPath)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f3a827]/15 text-[#c98912]">
            <Mail className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
            <p className="text-xs text-muted-foreground">One last step to activate your account</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/">
            <X className="size-4" aria-hidden />
            Close
          </Link>
        </Button>
      </div>

      <Separator className="mb-6" />

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        Enter the 6-digit code we sent to your inbox. The next box focuses
        automatically as you type. Do not share this code with anyone.
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

        <div className="space-y-3">
          <Label htmlFor="verify-otp">
            Verification code <span className="text-destructive">*</span>
          </Label>
          <InputOTP
            id="verify-otp"
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            onChange={handleOtpChange}
            disabled={isSubmitting}
            autoComplete="one-time-code"
            inputMode="numeric"
            containerClassName="justify-between gap-1 sm:gap-2"
            aria-invalid={Boolean(fieldErrors.otp)}
            aria-label="Verification code"
          >
            <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  aria-invalid={Boolean(fieldErrors.otp)}
                  className="size-11 flex-1 rounded-lg border border-input text-base font-semibold first:rounded-lg last:rounded-lg sm:size-12 sm:text-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {fieldErrors.otp ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.otp}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Paste works too — the code fills all boxes at once.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
          size="lg"
          disabled={isSubmitting || otp.length !== OTP_LENGTH}
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
