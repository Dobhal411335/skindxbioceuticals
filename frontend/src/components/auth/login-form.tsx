"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type LoginFormProps = {
  variant?: "page" | "panel";
};

export function LoginForm({ variant = "page" }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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

      <form
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="login-email">
            Username or email address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            className="h-11 rounded-full"
            placeholder="you@example.com"
          />
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
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
          size="lg"
        >
          Log in
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
        <Button
          type="button"
          className="h-11 w-full rounded-full bg-[#3b5998] text-white hover:bg-[#334f87]"
          disabled
        >
          Facebook
        </Button>
        <Button
          type="button"
          className="h-11 w-full rounded-full bg-[#4285f4] text-white hover:bg-[#3b78e0]"
        >
          Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Static UI only — Google OAuth will verify identity tokens server-side when
          connected. Facebook is shown disabled until approved.
        </p>
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
