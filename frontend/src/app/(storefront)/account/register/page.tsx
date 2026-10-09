import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account | SkinDx Bioceuticals",
  description: "Create a SkinDx Bioc customer account.",
};

export default function RegisterPage() {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <SignupForm />
    </div>
  );
}
