import { FALLBACK_ABOUT_US_BANNER } from "@/features/about-us-banner/about-us-banner.defaults";
import { mapAboutUsBannerConfigToStorefront } from "@/features/about-us-banner/about-us-banner.service";
import type { AboutUsBannerConfig } from "@/types/about-us-banner";

const baseConfig: AboutUsBannerConfig = {
  id: "cfg-1",
  siteCode: "IN",
  promoLabel: "SPECIALS DEALS",
  promoHeading: "Countless Attractive Offers",
  promoSubheading: "Limited quantity",
  promoButtonLabel: "Shop Now",
  promoButtonUrl: "/shop",
  aboutCards: [
    {
      id: "c1",
      imageUrl: "http://res.cloudinary.com/demo/image/upload/v1/about.jpg",
      imagePublicId: "about/1",
      label: "About us",
      heading: "Create Fresh Youthfulness",
      description: "Brand philosophy.",
      buttonLabel: "Read More About Us",
      buttonUrl: "/about",
      sortOrder: 0,
      active: true,
    },
  ],
  highlightItems: [
    {
      id: "h1",
      imageUrl: "https://cdn.example.com/h.jpg",
      imagePublicId: "about/h",
      heading: "Why customized care matters",
      buttonLabel: "Read more",
      buttonUrl: "/blog/custom",
      sortOrder: 0,
      active: true,
    },
  ],
  textSlides: [
    {
      id: "t1",
      heading: "Crafting Timeless Elegance",
      subheading: "Everyday clarity.",
      sortOrder: 0,
      active: true,
    },
  ],
  updatedAt: "2026-10-11T00:00:00.000Z",
};

describe("mapAboutUsBannerConfigToStorefront", () => {
  it("maps API data and prefers https Cloudinary URLs", () => {
    const mapped = mapAboutUsBannerConfigToStorefront(baseConfig);
    expect(mapped.promo.title).toBe("Countless Attractive Offers");
    expect(mapped.aboutCards[0]?.image.src).toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/about.jpg",
    );
    expect(mapped.highlightItems[0]?.buttonLabel).toBe("Read more");
    expect(mapped.textSlides[0]?.title).toBe("Crafting Timeless Elegance");
  });

  it("falls back to landing defaults when sections are empty", () => {
    const mapped = mapAboutUsBannerConfigToStorefront({
      ...baseConfig,
      promoHeading: "",
      aboutCards: [],
      highlightItems: [],
      textSlides: [],
    });
    expect(mapped.promo).toEqual(FALLBACK_ABOUT_US_BANNER.promo);
    expect(mapped.aboutCards).toEqual(FALLBACK_ABOUT_US_BANNER.aboutCards);
    expect(mapped.highlightItems).toEqual(
      FALLBACK_ABOUT_US_BANNER.highlightItems,
    );
    expect(mapped.textSlides).toEqual(FALLBACK_ABOUT_US_BANNER.textSlides);
  });
});
