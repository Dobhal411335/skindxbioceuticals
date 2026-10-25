export type SiteCodeDto = 'IN' | 'COM';

export type HeroBannerLayoutTypeDto = 'FULL_WIDTH' | 'SPLIT_DUAL' | 'MULTI_IMAGE';

export type HeroBannerGridImageDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  alt: string;
  order: number;
};

export type HeroBannerSlideDto = {
  id: string;
  layoutType: HeroBannerLayoutTypeDto;
  order: number;
  active: boolean;
  mobileImageUrl: string;
  mobileImagePublicId: string;
  desktopImageUrl: string;
  desktopImagePublicId: string;
  miniHeading: string;
  mainHeading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  button2Label: string;
  button2Url: string;
  leftImageUrl: string;
  leftImagePublicId: string;
  leftImageClickUrl?: string;
  rightImageUrl: string;
  rightImagePublicId: string;
  rightImageClickUrl?: string;
  gridImages: HeroBannerGridImageDto[];
};

export type HeroBannerConfigDto = {
  siteCode: SiteCodeDto;
  slides: HeroBannerSlideDto[];
};

export type HeroBannerGridImageRecord = {
  id: string;
  slideId: string;
  imageUrl: string;
  imagePublicId: string;
  alt: string;
  order: number;
};

export type HeroBannerSlideRecord = {
  id: string;
  siteId: string;
  layoutType: HeroBannerLayoutTypeDto;
  order: number;
  active: boolean;
  mobileImageUrl: string;
  mobileImagePublicId: string;
  desktopImageUrl: string;
  desktopImagePublicId: string;
  miniHeading: string;
  mainHeading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  button2Label: string;
  button2Url: string;
  leftImageUrl: string;
  leftImagePublicId: string;
  leftImageClickUrl?: string;
  rightImageUrl: string;
  rightImagePublicId: string;
  rightImageClickUrl?: string;
  gridImages: HeroBannerGridImageRecord[];
};

export type HeroBannerGridImageWrite = {
  imageUrl: string;
  imagePublicId: string;
  alt: string;
  order: number;
};

export type HeroBannerSlideWrite = {
  layoutType: HeroBannerLayoutTypeDto;
  order: number;
  active: boolean;
  mobileImageUrl: string;
  mobileImagePublicId: string;
  desktopImageUrl: string;
  desktopImagePublicId: string;
  miniHeading: string;
  mainHeading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  button2Label: string;
  button2Url: string;
  leftImageUrl: string;
  leftImagePublicId: string;
  leftImageClickUrl?: string;
  rightImageUrl: string;
  rightImagePublicId: string;
  rightImageClickUrl?: string;
  gridImages: HeroBannerGridImageWrite[];
};
