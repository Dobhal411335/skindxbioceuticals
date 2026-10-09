import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in | SkinDx Bioceuticals",
  description: "Sign in to your SkinDx Bioc account.",
};

export default function LoginPage() {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <LoginForm />
    </div>
  );
}
