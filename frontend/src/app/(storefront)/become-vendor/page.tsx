import type { Metadata } from "next";

import { BecomeVendorForm } from "@/components/vendors/become-vendor-form";

export const metadata: Metadata = {
  title: "Become a Vendor | SkinDx Bioceuticals",
  description: "Apply to become a SkinDx Bioceuticals vendor partner.",
};

export default function BecomeVendorPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <BecomeVendorForm />
    </div>
  );
}
