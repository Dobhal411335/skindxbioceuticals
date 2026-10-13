export type BannerImageRef = {
  url: string;
  publicId: string;
};

export type PromoBannerItemFormValues = {
  clientKey: string;
  image: BannerImageRef;
  miniHeading: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
};

export type PromoBannerFormValues = {
  items: PromoBannerItemFormValues[];
};

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

export type PromoBannerConfigPayload = {
  items: Array<{
    imageUrl: string;
    imagePublicId: string;
    miniHeading: string;
    heading: string;
    buttonLabel: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
};

export type CollectionBannerItemFormValues = {
  clientKey: string;
  image: BannerImageRef;
  title: string;
  description: string;
  buttonUrl: string;
  active: boolean;
};

export type CollectionBannerFormValues = {
  sectionLabel: string;
  sectionHeading: string;
  items: CollectionBannerItemFormValues[];
};

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

export type CollectionBannerConfigPayload = {
  sectionLabel: string;
  sectionHeading: string;
  items: Array<{
    imageUrl: string;
    imagePublicId: string;
    title: string;
    description: string;
    buttonUrl: string;
    sortOrder: number;
    active: boolean;
  }>;
};
