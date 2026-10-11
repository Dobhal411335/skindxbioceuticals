import type {
  AboutUsBannerConfigPayload,
  AboutUsBannerFormValues,
} from "@/types/about-us-banner";

function isOptionalUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type AboutUsBannerFormErrors = {
  promoLabel?: string;
  promoHeading?: string;
  promoSubheading?: string;
  promoButtonLabel?: string;
  promoButtonUrl?: string;
  aboutCards?: string;
  highlightItems?: string;
  textSlides?: string;
};

export function validateAboutUsBannerForm(
  values: AboutUsBannerFormValues,
):
  | { success: true; data: AboutUsBannerFormValues }
  | { success: false; errors: AboutUsBannerFormErrors } {
  const errors: AboutUsBannerFormErrors = {};

  if (values.promoLabel.trim().length > 100) {
    errors.promoLabel = "Label must be 100 characters or fewer";
  }
  if (values.promoHeading.trim().length > 300) {
    errors.promoHeading = "Heading must be 300 characters or fewer";
  }
  if (values.promoSubheading.trim().length > 1000) {
    errors.promoSubheading = "Subheading must be 1000 characters or fewer";
  }
  if (values.promoButtonLabel.trim().length > 100) {
    errors.promoButtonLabel = "Button label must be 100 characters or fewer";
  }
  if (!isOptionalUrl(values.promoButtonUrl)) {
    errors.promoButtonUrl = "Enter a path, hash link, or absolute URL";
  }

  for (const [index, card] of values.aboutCards.entries()) {
    if (!card.heading.trim()) {
      errors.aboutCards = `About card ${index + 1}: heading is required`;
      break;
    }
    if (!card.description.trim()) {
      errors.aboutCards = `About card ${index + 1}: description is required`;
      break;
    }
    if (!card.buttonLabel.trim()) {
      errors.aboutCards = `About card ${index + 1}: button label is required`;
      break;
    }
    if (!isOptionalUrl(card.buttonUrl)) {
      errors.aboutCards = `About card ${index + 1}: invalid button URL`;
      break;
    }
  }

  for (const [index, item] of values.highlightItems.entries()) {
    if (!item.heading.trim()) {
      errors.highlightItems = `Highlight ${index + 1}: heading is required`;
      break;
    }
    if (!item.buttonLabel.trim()) {
      errors.highlightItems = `Highlight ${index + 1}: button label is required`;
      break;
    }
    if (!isOptionalUrl(item.buttonUrl)) {
      errors.highlightItems = `Highlight ${index + 1}: invalid button URL`;
      break;
    }
  }

  for (const [index, slide] of values.textSlides.entries()) {
    if (!slide.heading.trim()) {
      errors.textSlides = `Text slide ${index + 1}: heading is required`;
      break;
    }
    if (!slide.subheading.trim()) {
      errors.textSlides = `Text slide ${index + 1}: subheading is required`;
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: values };
}

function trimText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function preferHttpsUrl(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

export function toAboutUsBannerPayload(
  values: AboutUsBannerFormValues,
): AboutUsBannerConfigPayload {
  return {
    promoLabel: trimText(values.promoLabel),
    promoHeading: trimText(values.promoHeading),
    promoSubheading: trimText(values.promoSubheading),
    promoButtonLabel: trimText(values.promoButtonLabel),
    promoButtonUrl: trimText(values.promoButtonUrl),
    aboutCards: values.aboutCards.map((card, index) => ({
      imageUrl: preferHttpsUrl(trimText(card.image?.url)),
      imagePublicId: trimText(card.image?.publicId),
      label: trimText(card.label),
      heading: trimText(card.heading),
      description: trimText(card.description),
      buttonLabel: trimText(card.buttonLabel),
      buttonUrl: trimText(card.buttonUrl),
      active: card.active,
      sortOrder: index,
    })),
    highlightItems: values.highlightItems.map((item, index) => ({
      imageUrl: preferHttpsUrl(trimText(item.image?.url)),
      imagePublicId: trimText(item.image?.publicId),
      heading: trimText(item.heading),
      buttonLabel: trimText(item.buttonLabel),
      buttonUrl: trimText(item.buttonUrl),
      active: item.active,
      sortOrder: index,
    })),
    textSlides: values.textSlides.map((slide, index) => ({
      heading: trimText(slide.heading),
      subheading: trimText(slide.subheading),
      active: slide.active,
      sortOrder: index,
    })),
  };
}
