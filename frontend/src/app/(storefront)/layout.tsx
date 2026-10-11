import type { ReactNode } from "react";

import { StorefrontShell } from "@/components/layout/storefront-shell";
import { getCompanyBasicInfo } from "@/features/company-basic-info/company-basic-info.service";
import { getFooterConfig } from "@/features/footer/footer.service";
import { getNavbarSections } from "@/features/navbar-sections/navbar-sections.service";
import { getTopAdvertisement } from "@/features/top-advertisement/top-advertisement.service";
import { CompanyBasicInfoProvider } from "@/providers/company-basic-info-provider";
import { FooterProvider } from "@/providers/footer-provider";
import { NavbarSectionsProvider } from "@/providers/navbar-sections-provider";
import { TopAdvertisementProvider } from "@/providers/top-advertisement-provider";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [companyBasicInfo, navbarSections, footer, topAdvertisement] =
    await Promise.all([
      getCompanyBasicInfo(),
      getNavbarSections(),
      getFooterConfig(),
      getTopAdvertisement(),
    ]);

  return (
    <CompanyBasicInfoProvider value={companyBasicInfo}>
      <NavbarSectionsProvider value={navbarSections}>
        <FooterProvider value={footer}>
          <TopAdvertisementProvider value={topAdvertisement}>
            <StorefrontShell>{children}</StorefrontShell>
          </TopAdvertisementProvider>
        </FooterProvider>
      </NavbarSectionsProvider>
    </CompanyBasicInfoProvider>
  );
}
