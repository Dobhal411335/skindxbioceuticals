export type SiteCodeDto = 'IN' | 'COM';

export type CollectionBannerItemDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  description: string;
  buttonUrl: string;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  sortOrder: number;
  active: boolean;
};

export type CollectionBannerConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  sectionLabel: string;
  sectionHeading: string;
  items: CollectionBannerItemDto[];
  updatedAt: string | null;
};

export type CollectionBannerItemRecord = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  description: string;
  buttonUrl: string;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  sortOrder: number;
  active: boolean;
};

export type CollectionBannerConfigRecord = {
  id: string;
  siteId: string;
  sectionLabel: string;
  sectionHeading: string;
  updatedAt: Date;
  items: CollectionBannerItemRecord[];
};

export type CollectionBannerItemWrite = {
  imageUrl: string;
  imagePublicId: string;
  title: string;
  description: string;
  buttonUrl: string;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  sortOrder: number;
  active: boolean;
};

export type CollectionBannerConfigUpsertData = {
  sectionLabel: string;
  sectionHeading: string;
  items: CollectionBannerItemWrite[];
};
