export type AboutUsImageRef = {
  url: string;
  publicId: string;
};

export type AboutUsAboutCardFormValues = {
  image: AboutUsImageRef;
  label: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
};

export type AboutUsHighlightItemFormValues = {
  image: AboutUsImageRef;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
};

export type AboutUsTextSlideFormValues = {
  heading: string;
  subheading: string;
  active: boolean;
};

export type AboutUsBannerFormValues = {
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  aboutCards: AboutUsAboutCardFormValues[];
  highlightItems: AboutUsHighlightItemFormValues[];
  textSlides: AboutUsTextSlideFormValues[];
};

export type AboutUsAboutCardDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  label: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsHighlightItemDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsTextSlideDto = {
  id: string;
  heading: string;
  subheading: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsBannerConfigDto = {
  id: string | null;
  siteCode: "IN" | "COM";
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  aboutCards: AboutUsAboutCardDto[];
  highlightItems: AboutUsHighlightItemDto[];
  textSlides: AboutUsTextSlideDto[];
  updatedAt: string | null;
};

export type AboutUsBannerConfigPayload = {
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  aboutCards: Array<{
    imageUrl: string;
    imagePublicId: string;
    label: string;
    heading: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
    active: boolean;
    sortOrder: number;
  }>;
  highlightItems: Array<{
    imageUrl: string;
    imagePublicId: string;
    heading: string;
    buttonLabel: string;
    buttonUrl: string;
    active: boolean;
    sortOrder: number;
  }>;
  textSlides: Array<{
    heading: string;
    subheading: string;
    active: boolean;
    sortOrder: number;
  }>;
};
