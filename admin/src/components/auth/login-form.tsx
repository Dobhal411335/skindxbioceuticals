"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/api/errors";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  serifClassName?: string;
}

export function LoginForm({ serifClassName }: LoginFormProps = {}) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof LoginFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data.email, parsed.data.password);
      showSuccess("Signed in successfully.", { id: "admin.auth.login.success" });
      router.replace("/select-site");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to sign in. Please try again.";
      showError(message, { id: "admin.auth.login.error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-7 rounded-[24px] border border-black/5 bg-white px-7 py-8 shadow-[0_18px_50px_rgb(20_35_45_/8%)] sm:px-9 sm:py-10"
      noValidate
      data-testid="login-form"
    >
      <div className="space-y-2">
        <h1
          className={cn("text-[2rem] leading-tight tracking-tight text-[#15212B]", serifClassName)}
        >
          Admin Login
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue managing the SkinDx Bioc websites.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
        >
          Email
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            placeholder="you@company.com"
            disabled={isSubmitting}
            className="h-12 rounded-xl border-[#E1E7EB] bg-[#FCFCFD] pl-11"
          />
        </div>
        {fieldErrors.email ? (
          <p id="email-error" className="text-xs text-destructive" data-testid="email-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
        >
          Password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className="h-12 rounded-xl border-[#E1E7EB] bg-[#FCFCFD] pr-11 pl-11"
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-error" className="text-xs text-destructive" data-testid="password-error">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-full bg-primary text-base font-medium hover:bg-primary-hover"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-[11px] tracking-wide text-muted-foreground/80">
        SkinDx Bioc Admin
      </p>
    </form>
  );
}
