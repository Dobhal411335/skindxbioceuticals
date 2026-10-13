export type CollectionBannerItemDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  description: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type CollectionBannerConfigDto = {
  id: string | null;
  siteCode: "IN" | "COM";
  sectionLabel: string;
  sectionHeading: string;
  items: CollectionBannerItemDto[];
  updatedAt: string | null;
};

export type StorefrontCollectionSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  href: string;
  alt: string;
};

export type StorefrontCollectionBanner = {
  sectionLabel: string;
  sectionHeading: string;
  items: StorefrontCollectionSlide[];
};
