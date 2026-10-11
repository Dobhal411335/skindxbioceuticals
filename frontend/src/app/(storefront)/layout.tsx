import type { ReactNode } from "react";

import { StorefrontShell } from "@/components/layout/storefront-shell";
import { getCompanyBasicInfo } from "@/features/company-basic-info/company-basic-info.service";
import { getNavbarSections } from "@/features/navbar-sections/navbar-sections.service";
import { CompanyBasicInfoProvider } from "@/providers/company-basic-info-provider";
import { NavbarSectionsProvider } from "@/providers/navbar-sections-provider";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [companyBasicInfo, navbarSections] = await Promise.all([
    getCompanyBasicInfo(),
    getNavbarSections(),
  ]);

  return (
    <CompanyBasicInfoProvider value={companyBasicInfo}>
      <NavbarSectionsProvider value={navbarSections}>
        <StorefrontShell>{children}</StorefrontShell>
      </NavbarSectionsProvider>
    </CompanyBasicInfoProvider>
  );
}
