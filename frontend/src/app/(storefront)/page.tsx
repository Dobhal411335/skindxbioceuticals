import { AboutSplit } from "@/components/landing/about-split";
import { OurServices } from "@/components/landing/our-services";
import { BlogGrid } from "@/components/landing/blog-grid";
import { CookieConsentBanner } from "@/components/landing/cookie-consent-banner";
import { FaqSection } from "@/components/landing/faq-section";
import { FeatureBenefitsBar } from "@/components/landing/feature-benefits-bar";
import { FeaturedProductRail } from "@/components/landing/featured-product-rail";
import { HeroSection } from "@/components/landing/hero-section";
import { InsightsGrid } from "@/components/landing/insights-grid";
import { InsightsQaSection } from "@/components/landing/insights-qa-section";
import { MarqueeBanner } from "@/components/landing/marquee-banner";
import { ProductHighlightColumns } from "@/components/landing/product-highlight-columns";
import { CollectionBannerSection } from "@/components/landing/collection-banner-section";
import { PromoBannerRow } from "@/components/landing/promo-banner-row";
import { SocialPostsSection } from "@/components/landing/social-posts-section";
import { SpecialsHeader } from "@/components/landing/specials-header";
import { StyleGallery } from "@/components/landing/style-gallery";
import { TestimonialsGrid } from "@/components/landing/testimonials-grid";
import { TrustBenefitsBar } from "@/components/landing/trust-benefits-bar";
import { getAboutUsBanner } from "@/features/about-us-banner/about-us-banner.service";
import { getCollectionBanner } from "@/features/collection-banner/collection-banner.service";
import { getCustomerReviews } from "@/features/customer-reviews/customer-reviews.service";
import { getLandingFaqs } from "@/features/faq/faq.service";
import { getGalleryItems } from "@/features/gallery/gallery.service";
import { getHeroBanners } from "@/features/hero-banner/hero-banner.service";
import { getLandingInsights } from "@/features/insights/insights.service";
import { getPromoBanners } from "@/features/promo-banner/promo-banner.service";
import {
  getLandingProductHighlights,
  getLandingProducts,
} from "@/features/products/product.service";
import { getSocialPosts } from "@/features/social-posts/social-posts.service";

export default async function HomePage() {
  const [
    socialPosts,
    galleryItems,
    aboutUsBanner,
    customerReviews,
    landingFaqs,
    landingInsights,
    heroSlides,
    landingProducts,
    productHighlights,
    promoBanners,
    collectionBanner,
  ] = await Promise.all([
    getSocialPosts(),
    getGalleryItems(),
    getAboutUsBanner(),
    getCustomerReviews(),
    getLandingFaqs(),
    getLandingInsights(),
    getHeroBanners(),
    getLandingProducts(15),
    getLandingProductHighlights(),
    getPromoBanners(),
    getCollectionBanner(),
  ]);

  return (
    <>
      <HeroSection slides={heroSlides} />
      <TrustBenefitsBar />
      <SpecialsHeader promo={aboutUsBanner.promo} />
      <AboutSplit cards={aboutUsBanner.aboutCards} />
      <OurServices
        servicesHeading={aboutUsBanner.servicesHeading ?? "Caring for your child, every step of the way"}
        servicesViewAll={aboutUsBanner.servicesViewAll ?? { label: "View all services", href: "/services" }}
        services={aboutUsBanner.services ?? []}
      />
      <FeaturedProductRail products={landingProducts} />
      <PromoBannerRow items={promoBanners} />
      <ProductHighlightColumns highlights={productHighlights} />
      <TestimonialsGrid reviews={customerReviews} />
      <BlogGrid />
      <InsightsGrid insights={landingInsights} />
      <FeatureBenefitsBar />
      <StyleGallery items={galleryItems} />
      <CollectionBannerSection banner={collectionBanner} />
      <FaqSection items={landingFaqs} />
      <SocialPostsSection posts={socialPosts} />
      <MarqueeBanner />
      <InsightsQaSection items={landingInsights.qaItems} />
      <CookieConsentBanner />
    </>
  );
}
