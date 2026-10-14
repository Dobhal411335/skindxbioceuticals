import type { Metadata } from "next";
import Link from "next/link";

import { DoctorsAboutSection } from "@/components/doctors/doctors-about-section";
import { DoctorsDirectory } from "@/components/doctors/doctors-directory";
import { DoctorsServicesSection } from "@/components/doctors/doctors-services-section";
import {
  getDoctorPageConfig,
  getDoctorProfiles,
} from "@/features/doctors/doctors.service";

export const metadata: Metadata = {
  title: "Doctors | SkinDx Bioceuticals",
  description:
    "Meet SkinDx-associated clinicians and explore specialist services on our doctors page.",
};

export default async function DoctorsPage() {
  const [pageConfig, doctors] = await Promise.all([
    getDoctorPageConfig(),
    getDoctorProfiles(),
  ]);

  const hasAbout =
    Boolean(pageConfig.aboutHeading) ||
    Boolean(pageConfig.aboutDescription) ||
    pageConfig.aboutHighlights.length > 0 ||
    Boolean(pageConfig.aboutImageUrl);
  const hasServices =
    Boolean(pageConfig.servicesHeading) ||
    Boolean(pageConfig.servicesSubheading) ||
    pageConfig.services.length > 0;
  const emptyPage = !hasAbout && !hasServices && doctors.length === 0;

  return (
    <>
      <div className="container-page pt-6">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Doctors</span>
        </nav>
      </div>

      {emptyPage ? (
        <section className="container-page py-20 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Doctors</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Doctor profiles and landing content will appear here once published in
            admin.
          </p>
        </section>
      ) : (
        <>
          <DoctorsAboutSection config={pageConfig} />
          <DoctorsServicesSection config={pageConfig} />
          <DoctorsDirectory doctors={doctors} />
        </>
      )}
    </>
  );
}
