export const WEBPAGE_TEMPLATE_TYPES = [
  "design1",
  "design2",
  "design3",
  "design4",
  "design5",
  "design6",
  "design7",
  "design9",
] as const;

export type WebpageTemplateType = (typeof WEBPAGE_TEMPLATE_TYPES)[number];

export type WebpageImageAsset = {
  url: string;
  key: string;
};

export type WebpagePostedBy = {
  admin: boolean;
  user: boolean;
};

export type WebpageHighlight = { title: string; point: string };

export type WebpageParagraphSection = {
  title: string;
  description: string;
  firstImage: WebpageImageAsset;
  secondImage: WebpageImageAsset;
  bulletPoints: string[];
};

export type WebpageTableRow = { column1: string; column2: string };
export type WebpageAccordionTag = { left: string; right: string };
export type WebpageNotice = {
  title: string;
  description: string;
  type: "warning" | "info" | "danger" | "success" | string;
};
export type WebpageSearchLocation = {
  locationName: string;
  count: string;
  url: string;
};
export type WebpageAdvertisement = {
  image: WebpageImageAsset;
  url: string;
};
export type WebpageGridCard = {
  image: WebpageImageAsset;
  chipName: string;
  title: string;
  link: string;
  galleryDate?: string;
  postedBy?: string;
  galleryDescription?: string;
  gallerySlug?: string;
  bentoImages?: WebpageImageAsset[];
  youtubeShorts?: string[];
  youtubeVideos?: string[];
};
export type WebpageTeamCard = {
  image: WebpageImageAsset;
  name: string;
  designation: string;
  qualification: string;
  specialization: string;
  phone: string;
  facebook: string;
  instagram: string;
  youtube: string;
};
export type WebpageDesign9Card = {
  heading: string;
  description: string;
  images: WebpageImageAsset[];
};

export type WebpageListDto = {
  id: string;
  siteCode: "IN" | "COM";
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
  createTags: string[];
  postedBy: WebpagePostedBy;
  highlights: WebpageHighlight[];
  paragraphSections: WebpageParagraphSection[];
  tableTitle: string;
  tableRows: WebpageTableRow[];
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: string[];
  accordionTags: WebpageAccordionTag[];
  advertisements: WebpageAdvertisement[];
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: WebpageImageAsset[];
  notices: WebpageNotice[];
  searchLocations: WebpageSearchLocation[];
  design5Chip: string;
  design5MainHeading: string;
  gridCards: WebpageGridCard[];
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: WebpageTeamCard[];
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: WebpageDesign9Card[];
};

export type WebpageContentUpdatePayload = Partial<
  Omit<WebpageDto, "id" | "siteCode" | "createdAt" | "updatedAt">
>;

export type WebpageCreatePayload = {
  title: string;
  slug?: string;
  active?: boolean;
  templateType?: WebpageTemplateType;
};

export type WebpageMetaPatchPayload = {
  title?: string;
  slug?: string;
  active?: boolean;
  templateType?: WebpageTemplateType;
};

export type WebpageEditFormValues = {
  title: string;
  slug: string;
  active: boolean;
  templateType: WebpageTemplateType;
  titleLine: string;
  keywords: string[];
  firstTitle: string;
  secondTitle: string;
  imageFirst: WebpageImageAsset;
  imageFirstMobile: WebpageImageAsset;
  bannerImage: WebpageImageAsset;
  bannerImageMobile: WebpageImageAsset;
  paragraphFirstImage: WebpageImageAsset;
  paragraphSecondImage: WebpageImageAsset;
  advertisementImage: WebpageImageAsset;
  sideThumbImage: WebpageImageAsset;
  mainProfileImage: WebpageImageAsset;
  createTags: string[];
  postedBy: WebpagePostedBy;
  highlights: WebpageHighlight[];
  paragraphSections: WebpageParagraphSection[];
  tableTitle: string;
  tableRows: WebpageTableRow[];
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: string[];
  accordionTags: WebpageAccordionTag[];
  advertisements: WebpageAdvertisement[];
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: WebpageImageAsset[];
  notices: WebpageNotice[];
  searchLocations: WebpageSearchLocation[];
  design5Chip: string;
  design5MainHeading: string;
  gridCards: WebpageGridCard[];
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: WebpageTeamCard[];
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: WebpageDesign9Card[];
};
