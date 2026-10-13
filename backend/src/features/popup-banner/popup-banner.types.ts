export type SiteCodeDto = 'IN' | 'COM';

export type PopupBannerConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  subDescription: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  updatedAt: string | null;
};

export type PopupBannerConfigRecord = {
  id: string;
  siteId: string;
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  subDescription: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
  updatedAt: Date;
};

export type PopupBannerConfigUpsertData = {
  imageUrl: string;
  imagePublicId: string;
  miniHeading: string;
  heading: string;
  subDescription: string;
  buttonLabel: string;
  buttonUrl: string;
  active: boolean;
};
