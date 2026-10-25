export type SiteCodeDto = 'IN' | 'COM';

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

export type AboutUsServiceHighlightDto = {
  id: string;
  text: string;
  sortOrder: number;
};

export type AboutUsServiceDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  buttonLabel: string;
  heading: string;
  description: string;
  highlights: AboutUsServiceHighlightDto[];
  doctorImageUrl: string;
  doctorImagePublicId: string;
  doctorName: string;
  doctorDesignation: string;
  doctorButtonLabel: string;
  doctorButtonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsBannerConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  promoLabel: string;
  promoHeading: string;
  promoDescription?: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  servicesHeading?: string;
  servicesViewAllLabel?: string;
  servicesViewAllUrl?: string;
  aboutCards: AboutUsAboutCardDto[];
  highlightItems?: AboutUsHighlightItemDto[];
  textSlides?: AboutUsTextSlideDto[];
  services?: AboutUsServiceDto[];
  updatedAt: string | null;
};

export type AboutUsAboutCardRecord = {
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

export type AboutUsHighlightItemRecord = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsTextSlideRecord = {
  id: string;
  heading: string;
  subheading: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsServiceHighlightRecord = AboutUsServiceHighlightDto & {
  serviceId: string;
};

export type AboutUsServiceRecord = Omit<AboutUsServiceDto, 'highlights'> & {
  configId: string;
  highlights: AboutUsServiceHighlightRecord[];
};

export type AboutUsBannerConfigRecord = {
  id: string;
  siteId: string;
  promoLabel: string;
  promoHeading: string;
  promoDescription?: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  servicesHeading?: string;
  servicesViewAllLabel?: string;
  servicesViewAllUrl?: string;
  updatedAt: Date;
  aboutCards: AboutUsAboutCardRecord[];
  highlightItems: AboutUsHighlightItemRecord[];
  textSlides: AboutUsTextSlideRecord[];
  services?: AboutUsServiceRecord[];
};

export type AboutUsAboutCardWrite = {
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

export type AboutUsHighlightItemWrite = {
  imageUrl: string;
  imagePublicId: string;
  heading: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsTextSlideWrite = {
  heading: string;
  subheading: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsServiceHighlightWrite = {
  text: string;
  sortOrder: number;
};

export type AboutUsServiceWrite = {
  imageUrl: string;
  imagePublicId: string;
  buttonLabel: string;
  heading: string;
  description: string;
  highlights: AboutUsServiceHighlightWrite[];
  doctorImageUrl: string;
  doctorImagePublicId: string;
  doctorName: string;
  doctorDesignation: string;
  doctorButtonLabel: string;
  doctorButtonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type AboutUsBannerConfigUpsertData = {
  promoLabel: string;
  promoHeading: string;
  promoDescription?: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  servicesHeading?: string;
  servicesViewAllLabel?: string;
  servicesViewAllUrl?: string;
  aboutCards: AboutUsAboutCardWrite[];
  highlightItems: AboutUsHighlightItemWrite[];
  textSlides: AboutUsTextSlideWrite[];
  services?: AboutUsServiceWrite[];
};
