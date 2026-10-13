import type {
  CollectionBannerConfigPayload,
  CollectionBannerFormValues,
  PromoBannerConfigPayload,
  PromoBannerFormValues,
} from "@/types/promo-collection-banners";

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

export type PromoBannerFormErrors = {
  items?: string;
};

export type CollectionBannerFormErrors = {
  sectionLabel?: string;
  sectionHeading?: string;
  items?: string;
};

export function validatePromoBannerForm(
  values: PromoBannerFormValues,
):
  | { success: true; data: PromoBannerFormValues }
  | { success: false; errors: PromoBannerFormErrors } {
  const errors: PromoBannerFormErrors = {};

  for (const [index, item] of values.items.entries()) {
    if (!item.image.url.trim()) {
      errors.items = `Banner ${index + 1}: image is required`;
      break;
    }
    if (item.miniHeading.trim().length > 120) {
      errors.items = `Banner ${index + 1}: mini heading must be 120 characters or fewer`;
      break;
    }
    if (!item.heading.trim()) {
      errors.items = `Banner ${index + 1}: heading is required`;
      break;
    }
    if (item.heading.trim().length > 200) {
      errors.items = `Banner ${index + 1}: heading must be 200 characters or fewer`;
      break;
    }
    if (item.buttonLabel.trim().length > 80) {
      errors.items = `Banner ${index + 1}: button label must be 80 characters or fewer`;
      break;
    }
    if (!isOptionalUrl(item.buttonUrl)) {
      errors.items = `Banner ${index + 1}: enter a path, hash link, or absolute URL`;
      break;
    }
    if (item.buttonLabel.trim() && !item.buttonUrl.trim()) {
      errors.items = `Banner ${index + 1}: button URL is required when a button label is set`;
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: values };
}

export function toPromoBannerPayload(
  values: PromoBannerFormValues,
): PromoBannerConfigPayload {
  return {
    items: values.items.map((item, index) => ({
      imageUrl: item.image.url.trim(),
      imagePublicId: item.image.publicId.trim(),
      miniHeading: item.miniHeading.trim(),
      heading: item.heading.trim(),
      buttonLabel: item.buttonLabel.trim(),
      buttonUrl: item.buttonUrl.trim(),
      sortOrder: index,
      active: item.active,
    })),
  };
}

export function validateCollectionBannerForm(
  values: CollectionBannerFormValues,
):
  | { success: true; data: CollectionBannerFormValues }
  | { success: false; errors: CollectionBannerFormErrors } {
  const errors: CollectionBannerFormErrors = {};

  if (values.sectionLabel.trim().length > 100) {
    errors.sectionLabel = "Label must be 100 characters or fewer";
  }
  if (values.sectionHeading.trim().length > 300) {
    errors.sectionHeading = "Heading must be 300 characters or fewer";
  }

  for (const [index, item] of values.items.entries()) {
    if (!item.title.trim()) {
      errors.items = `Slide ${index + 1}: title is required`;
      break;
    }
    if (!item.image.url.trim()) {
      errors.items = `Slide ${index + 1}: image is required`;
      break;
    }
    if (!isOptionalUrl(item.buttonUrl)) {
      errors.items = `Slide ${index + 1}: enter a path, hash link, or absolute URL`;
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: values };
}

export function toCollectionBannerPayload(
  values: CollectionBannerFormValues,
): CollectionBannerConfigPayload {
  return {
    sectionLabel: values.sectionLabel.trim(),
    sectionHeading: values.sectionHeading.trim(),
    items: values.items.map((item, index) => ({
      imageUrl: item.image.url.trim(),
      imagePublicId: item.image.publicId.trim(),
      title: item.title.trim(),
      description: item.description.trim(),
      buttonUrl: item.buttonUrl.trim(),
      sortOrder: index,
      active: item.active,
    })),
  };
}
