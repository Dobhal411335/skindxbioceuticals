import type { Metadata } from "next";

import { VendorLoginForm } from "@/components/vendors/vendor-login-form";

export const metadata: Metadata = {
  title: "Vendor Login | SkinDx Bioceuticals",
  description: "Sign in to your SkinDx Bioceuticals vendor partner account.",
};

export default function VendorLoginPage() {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <VendorLoginForm />
    </div>
  );
}
