"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);

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

      <form
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
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
            className="h-11 rounded-full"
            placeholder="Your name"
          />
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
            className="h-11 rounded-full"
            placeholder="you@example.com"
          />
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
        </div>

        <div className="flex items-start gap-2">
          <Checkbox id="signup-terms" required />
          <Label htmlFor="signup-terms" className="text-xs leading-snug font-normal">
            I agree with the Terms &amp; Conditions and Privacy Policy. Consent is
            required before any live account creation.
          </Label>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#f3a827] text-white uppercase hover:bg-[#e0981f]"
          size="lg"
        >
          Sign up
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          Or sign up with
        </span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        className="h-11 w-full rounded-full bg-[#4285f4] text-white hover:bg-[#3b78e0]"
      >
        Continue with Google
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Static UI only — Google identity tokens will be verified on the server when
        auth is wired.
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
