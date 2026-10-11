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

export type AboutUsBannerConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
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

export type AboutUsBannerConfigRecord = {
  id: string;
  siteId: string;
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  updatedAt: Date;
  aboutCards: AboutUsAboutCardRecord[];
  highlightItems: AboutUsHighlightItemRecord[];
  textSlides: AboutUsTextSlideRecord[];
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

export type AboutUsBannerConfigUpsertData = {
  promoLabel: string;
  promoHeading: string;
  promoSubheading: string;
  promoButtonLabel: string;
  promoButtonUrl: string;
  aboutCards: AboutUsAboutCardWrite[];
  highlightItems: AboutUsHighlightItemWrite[];
  textSlides: AboutUsTextSlideWrite[];
};
