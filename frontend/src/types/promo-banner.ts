export type PromoBannerItemDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type PromoBannerConfigDto = {
  id: string | null;
  siteCode: "IN" | "COM";
  items: PromoBannerItemDto[];
  updatedAt: string | null;
};

export type StorefrontPromoBanner = {
  id: string;
  imageUrl: string;
  miniHeading: string;
  heading: string;
  buttonLabel: string;
  href: string;
  alt: string;
};
