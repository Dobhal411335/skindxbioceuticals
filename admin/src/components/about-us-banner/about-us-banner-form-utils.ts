import type {
  AboutUsAboutCardFormValues,
  AboutUsBannerConfigDto,
  AboutUsBannerFormValues,
  AboutUsHighlightItemFormValues,
  AboutUsTextSlideFormValues,
} from "@/types/about-us-banner";

export function createEmptyAboutCard(): AboutUsAboutCardFormValues {
  return {
    image: { url: "", publicId: "" },
    label: "About us",
    heading: "",
    description: "",
    buttonLabel: "Read more about us",
    buttonUrl: "/about",
    active: true,
  };
}

export function createEmptyHighlightItem(): AboutUsHighlightItemFormValues {
  return {
    image: { url: "", publicId: "" },
    heading: "",
    buttonLabel: "Read more",
    buttonUrl: "",
    active: true,
  };
}

export function createEmptyTextSlide(): AboutUsTextSlideFormValues {
  return {
    heading: "",
    subheading: "",
    active: true,
  };
}

export function createEmptyFormValues(): AboutUsBannerFormValues {
  return {
    promoLabel: "",
    promoHeading: "",
    promoSubheading: "",
    promoButtonLabel: "",
    promoButtonUrl: "",
    aboutCards: [],
    highlightItems: [],
    textSlides: [],
  };
}

export function dtoToFormValues(dto: AboutUsBannerConfigDto): AboutUsBannerFormValues {
  return {
    promoLabel: dto.promoLabel ?? "",
    promoHeading: dto.promoHeading ?? "",
    promoSubheading: dto.promoSubheading ?? "",
    promoButtonLabel: dto.promoButtonLabel ?? "",
    promoButtonUrl: dto.promoButtonUrl ?? "",
    aboutCards: (dto.aboutCards || []).map((card) => ({
      image: {
        url: card.imageUrl ?? "",
        publicId: card.imagePublicId ?? "",
      },
      label: card.label ?? "",
      heading: card.heading ?? "",
      description: card.description ?? "",
      buttonLabel: card.buttonLabel ?? "",
      buttonUrl: card.buttonUrl ?? "",
      active: card.active ?? true,
    })),
    highlightItems: (dto.highlightItems || []).map((item) => ({
      image: {
        url: item.imageUrl ?? "",
        publicId: item.imagePublicId ?? "",
      },
      heading: item.heading ?? "",
      buttonLabel: item.buttonLabel ?? "",
      buttonUrl: item.buttonUrl ?? "",
      active: item.active ?? true,
    })),
    textSlides: (dto.textSlides || []).map((slide) => ({
      heading: slide.heading ?? "",
      subheading: slide.subheading ?? "",
      active: slide.active ?? true,
    })),
  };
}
