import { AboutSplit } from "@/components/landing/about-split";
import { BlogCarousel } from "@/components/landing/blog-carousel";
import { BlogGrid } from "@/components/landing/blog-grid";
import { FaqSection } from "@/components/landing/faq-section";
import { FeatureBenefitsBar } from "@/components/landing/feature-benefits-bar";
import { FeaturedProductRail } from "@/components/landing/featured-product-rail";
import { HeroSection } from "@/components/landing/hero-section";
import { InsightsGrid } from "@/components/landing/insights-grid";
import { MarqueeBanner } from "@/components/landing/marquee-banner";
import { ProductHighlightColumns } from "@/components/landing/product-highlight-columns";
import { PromoBannerRow } from "@/components/landing/promo-banner-row";
import { SpecialsHeader } from "@/components/landing/specials-header";
import { StyleGallery } from "@/components/landing/style-gallery";
import { TestimonialsGrid } from "@/components/landing/testimonials-grid";
import { TrustBenefitsBar } from "@/components/landing/trust-benefits-bar";

export default function HomePage() {
  return (
    <>
      <TrustBenefitsBar />
      <HeroSection />
      <SpecialsHeader />
      <AboutSplit />
      <BlogCarousel />
      <FeaturedProductRail />
      <PromoBannerRow />
      <ProductHighlightColumns />
      <TestimonialsGrid />
      <InsightsGrid />
      <BlogGrid />
      <FeatureBenefitsBar />
      <StyleGallery />
      <FaqSection />
      <MarqueeBanner />
    </>
  );
}
