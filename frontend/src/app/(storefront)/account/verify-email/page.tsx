import type { Metadata } from "next";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify email | SkinDx Bioceuticals",
  description: "Verify your SkinDx Bioc customer email address.",
};

export default function VerifyEmailPage() {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <VerifyEmailForm />
    </div>
  );
}
