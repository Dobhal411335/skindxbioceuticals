export type AboutUsBannerConfig = {
  id: string | null;
  siteCode: "IN" | "COM";
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  aboutCards: AboutUsAboutCard[];
  highlightItems: AboutUsHighlightItem[];
  textSlides: AboutUsTextSlide[];
  updatedAt: string | null;
};

export type AboutUsAboutCard = {
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

export type AboutUsHighlightItem = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsTextSlide = {
  id: string;
  heading: string;
  subheading: string;
  sortOrder: number;
  active: boolean;
};

export type StorefrontPromoHeader = {
  label: string;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
};

export type StorefrontAboutCard = {
  id: string;
  label: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

export type StorefrontHighlightItem = {
  id: string;
  title: string;
  image: string;
  alt: string;
  href: string;
  buttonLabel: string;
};

export type StorefrontTextSlide = {
  id: string;
  title: string;
  body: string;
};

export type StorefrontAboutUsBanner = {
  promo: StorefrontPromoHeader;
  aboutCards: StorefrontAboutCard[];
  highlightItems: StorefrontHighlightItem[];
  textSlides: StorefrontTextSlide[];
};
