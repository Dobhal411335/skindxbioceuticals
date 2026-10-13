export type SiteCodeDto = 'IN' | 'COM';

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
  siteCode: SiteCodeDto;
  items: PromoBannerItemDto[];
  updatedAt: string | null;
};

export type PromoBannerItemRecord = {
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

export type PromoBannerConfigRecord = {
  id: string;
  siteId: string;
  updatedAt: Date;
  items: PromoBannerItemRecord[];
};

export type PromoBannerItemWrite = {
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type PromoBannerConfigUpsertData = {
  items: PromoBannerItemWrite[];
};
