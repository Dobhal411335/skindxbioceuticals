import type { ReactNode } from "react";

import { StorefrontShell } from "@/components/layout/storefront-shell";
import { getCompanyBasicInfo } from "@/features/company-basic-info/company-basic-info.service";
import { CompanyBasicInfoProvider } from "@/providers/company-basic-info-provider";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const companyBasicInfo = await getCompanyBasicInfo();

  return (
    <CompanyBasicInfoProvider value={companyBasicInfo}>
      <StorefrontShell>{children}</StorefrontShell>
    </CompanyBasicInfoProvider>
  );
}
