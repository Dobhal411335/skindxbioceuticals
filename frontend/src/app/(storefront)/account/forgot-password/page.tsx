import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Reset password | SkinDx Bioceuticals",
  description: "Request a password reset for your SkinDx Bioc account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md rounded-xl border border-border p-6 sm:p-8">
        <h1 className="text-xl font-semibold">Lost your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email. Reset mail will send through Brevo once auth email is
          configured. This form is static UI only.
        </p>
        <form className="mt-6 space-y-4" action="#" method="get">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              className="rounded-full"
            />
          </div>
          <Button type="button" className="w-full rounded-full">
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/account/login" className="underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
