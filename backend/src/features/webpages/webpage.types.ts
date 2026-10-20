import type { Prisma } from '@prisma/client';
import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export const WEBPAGE_TEMPLATE_TYPES = [
  'design1',
  'design2',
  'design3',
  'design4',
  'design5',
  'design6',
  'design7',
  'design9',
] as const;

export type WebpageTemplateType = (typeof WEBPAGE_TEMPLATE_TYPES)[number];

export type WebpageImageAsset = {
  url: string;
  key: string;
};

export type WebpageListDto = {
  id: string;
  siteCode: SiteCodeDto;
  title: string;
  slug: string;
  active: boolean;
  templateType: WebpageTemplateType;
  createdAt: string;
  updatedAt: string;
};

export type WebpageDto = WebpageListDto & {
  titleLine: string;
  keywords: string[];
  firstTitle: string;
  secondTitle: string;
  imageFirst: WebpageImageAsset | null;
  imageFirstMobile: WebpageImageAsset | null;
  bannerImage: WebpageImageAsset | null;
  bannerImageMobile: WebpageImageAsset | null;
  paragraphFirstImage: WebpageImageAsset | null;
  paragraphSecondImage: WebpageImageAsset | null;
  advertisementImage: WebpageImageAsset | null;
  sideThumbImage: WebpageImageAsset | null;
  mainProfileImage: WebpageImageAsset | null;
  createTags: unknown;
  postedBy: unknown;
  highlights: unknown;
  paragraphSections: unknown;
  tableTitle: string;
  tableRows: unknown;
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: unknown;
  accordionTags: unknown;
  advertisements: unknown;
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: unknown;
  notices: unknown;
  searchLocations: unknown;
  design5Chip: string;
  design5MainHeading: string;
  gridCards: unknown;
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: unknown;
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: unknown;
};

export type WebpagePublicDto = Omit<WebpageDto, 'active'> & {
  active: true;
};

export type WebpageRecord = {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  active: boolean;
  templateType: string;
  titleLine: string;
  keywords: string[];
  firstTitle: string;
  secondTitle: string;
  imageFirst: Prisma.JsonValue | null;
  imageFirstMobile: Prisma.JsonValue | null;
  bannerImage: Prisma.JsonValue | null;
  bannerImageMobile: Prisma.JsonValue | null;
  paragraphFirstImage: Prisma.JsonValue | null;
  paragraphSecondImage: Prisma.JsonValue | null;
  advertisementImage: Prisma.JsonValue | null;
  sideThumbImage: Prisma.JsonValue | null;
  mainProfileImage: Prisma.JsonValue | null;
  createTags: Prisma.JsonValue;
  postedBy: Prisma.JsonValue;
  highlights: Prisma.JsonValue;
  paragraphSections: Prisma.JsonValue;
  tableTitle: string;
  tableRows: Prisma.JsonValue;
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: Prisma.JsonValue;
  accordionTags: Prisma.JsonValue;
  advertisements: Prisma.JsonValue;
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: Prisma.JsonValue;
  notices: Prisma.JsonValue;
  searchLocations: Prisma.JsonValue;
  design5Chip: string;
  design5MainHeading: string;
  gridCards: Prisma.JsonValue;
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: Prisma.JsonValue;
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type WebpageCreateWrite = {
  title: string;
  slug: string;
  active: boolean;
  templateType: WebpageTemplateType;
};

export type WebpageMetaPatchWrite = {
  title?: string;
  slug?: string;
  active?: boolean;
  templateType?: WebpageTemplateType;
};

export type WebpageContentWrite = Record<string, unknown>;
