import {
  toAboutUsBannerPayload,
  validateAboutUsBannerForm,
} from "@/schemas/about-us-banner-schema";
import type { AboutUsBannerFormValues } from "@/types/about-us-banner";

const validValues: AboutUsBannerFormValues = {
  promoLabel: "Featured offers",
  promoHeading: "Curated selections",
  promoSubheading: "While stocks last",
  promoButtonLabel: "Shop now",
  promoButtonUrl: "/shop",
  aboutCards: [
    {
      image: { url: "https://cdn.example.com/a.jpg", publicId: "about/a" },
      label: "About us",
      heading: "Science-led care",
      description: "Clear product presentation.",
      buttonLabel: "Read more",
      buttonUrl: "/about",
      active: true,
    },
  ],
  highlightItems: [
    {
      image: { url: "https://cdn.example.com/h.jpg", publicId: "about/h" },
      heading: "Ingredients guide",
      buttonLabel: "Read more",
      buttonUrl: "/blog/reading-ingredients",
      active: true,
    },
  ],
  textSlides: [
    {
      heading: "Crafting clarity",
      subheading: "Educational notes.",
      active: true,
    },
  ],
};

describe("about-us-banner-schema", () => {
  it("accepts a valid form and maps payload sort order", () => {
    const result = validateAboutUsBannerForm(validValues);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(toAboutUsBannerPayload(result.data)).toMatchObject({
      promoHeading: "Curated selections",
      aboutCards: [{ sortOrder: 0, heading: "Science-led care" }],
      highlightItems: [{ sortOrder: 0 }],
      textSlides: [{ sortOrder: 0 }],
    });
  });

  it("rejects invalid promo button URLs", () => {
    const result = validateAboutUsBannerForm({
      ...validValues,
      promoButtonUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.promoButtonUrl).toBeTruthy();
  });

  it("requires about card heading and description", () => {
    const result = validateAboutUsBannerForm({
      ...validValues,
      aboutCards: [
        {
          ...validValues.aboutCards[0]!,
          heading: "",
          description: "",
        },
      ],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.aboutCards).toContain("heading");
  });

  it("maps payload even when image publicId/url are missing after a bad upload map", () => {
    const payload = toAboutUsBannerPayload({
      ...validValues,
      aboutCards: [
        {
          ...validValues.aboutCards[0]!,
          image: {
            url: undefined as unknown as string,
            publicId: undefined as unknown as string,
          },
        },
      ],
    });
    expect(payload.aboutCards[0]).toMatchObject({
      imageUrl: "",
      imagePublicId: "",
      heading: "Science-led care",
    });
  });
});
