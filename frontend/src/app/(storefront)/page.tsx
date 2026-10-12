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
import { SocialPostsSection } from "@/components/landing/social-posts-section";
import { SpecialsHeader } from "@/components/landing/specials-header";
import { StyleGallery } from "@/components/landing/style-gallery";
import { TestimonialsGrid } from "@/components/landing/testimonials-grid";
import { TrustBenefitsBar } from "@/components/landing/trust-benefits-bar";
import { getAboutUsBanner } from "@/features/about-us-banner/about-us-banner.service";
import { getCustomerReviews } from "@/features/customer-reviews/customer-reviews.service";
import { getGalleryItems } from "@/features/gallery/gallery.service";
import { getSocialPosts } from "@/features/social-posts/social-posts.service";

export default async function HomePage() {
  const [socialPosts, galleryItems, aboutUsBanner, customerReviews] =
    await Promise.all([
      getSocialPosts(),
      getGalleryItems(),
      getAboutUsBanner(),
      getCustomerReviews(),
    ]);

  return (
    <>
      <HeroSection />
      <TrustBenefitsBar />
      <SpecialsHeader promo={aboutUsBanner.promo} />
      <AboutSplit cards={aboutUsBanner.aboutCards} />
      <BlogCarousel
        highlightItems={aboutUsBanner.highlightItems}
        textSlides={aboutUsBanner.textSlides}
      />
       <FeaturedProductRail />
      <PromoBannerRow />
      <ProductHighlightColumns />
      <TestimonialsGrid reviews={customerReviews} />
      <InsightsGrid />
      <BlogGrid />
      <FeatureBenefitsBar />
      <StyleGallery items={galleryItems} />
      <FaqSection />
      <SocialPostsSection posts={socialPosts} />
      <MarqueeBanner />
    </>
  );
}
