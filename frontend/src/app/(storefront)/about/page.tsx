import type { Metadata } from "next";
import Link from "next/link";

import { AboutBanner } from "@/components/about/about-banner";
import { AboutFaq } from "@/components/about/about-faq";
import { AboutHero } from "@/components/about/about-hero";
import { AboutPillars } from "@/components/about/about-pillars";
import { AboutStory } from "@/components/about/about-story";

export const metadata: Metadata = {
  title: "About Us | SkinDx Bioceuticals",
  description:
    "Learn about SkinDx Bioceuticals — a calm, science-led skincare storefront focused on clear product information for India.",
};

export default function AboutPage() {
  return (
    <>
      <div className="container-page pt-6">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">About</span>
        </nav>
      </div>

      <AboutHero />
      <AboutStory />
      <AboutBanner />
      <AboutPillars />
      <AboutFaq />
    </>
  );
}
