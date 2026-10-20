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

export type StorefrontWebpage = {
  id: string;
  siteCode: "IN" | "COM";
  title: string;
  slug: string;
  active: true;
  templateType: WebpageTemplateType | string;
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
  postedBy: { admin?: boolean; user?: boolean } | null;
  highlights: Array<{ title?: string; point?: string }>;
  paragraphSections: Array<{
    title?: string;
    description?: string;
    firstImage?: WebpageImageAsset | null;
    secondImage?: WebpageImageAsset | null;
    bulletPoints?: string[];
  }>;
  tableTitle: string;
  tableRows: Array<{ column1?: string; column2?: string }>;
  blockquoteMainTitle: string;
  blockquoteLeftTitle: string;
  blockquoteDescription: string;
  blockquoteTags: string[];
  accordionTags: Array<{ left?: string; right?: string }>;
  advertisements: Array<{ image?: WebpageImageAsset | null; url?: string }>;
  advertisementUrl: string;
  sideThumbName: string;
  sideThumbDesignation: string;
  sideThumbDescription: string;
  facebookUrl: string;
  youtubeUrl: string;
  instaUrl: string;
  googleUrl: string;
  imageGallery: WebpageImageAsset[];
  notices: Array<{ title?: string; description?: string; type?: string }>;
  searchLocations: Array<{
    locationName?: string;
    count?: string;
    url?: string;
  }>;
  design5Chip: string;
  design5MainHeading: string;
  gridCards: Array<{
    image?: WebpageImageAsset | null;
    chipName?: string;
    title?: string;
    link?: string;
    galleryDate?: string;
    postedBy?: string;
    galleryDescription?: string;
    gallerySlug?: string;
    bentoImages?: WebpageImageAsset[];
    youtubeShorts?: Array<string | { url?: string }>;
    youtubeVideos?: Array<string | { url?: string }>;
  }>;
  design6Chip: string;
  design6ExploreLink: string;
  design6MainHeading: string;
  design6SubHeading: string;
  design6Author: string;
  design6MidHeading: string;
  design6MidLink: string;
  teamCards: Array<{
    image?: WebpageImageAsset | null;
    name?: string;
    designation?: string;
    qualification?: string;
    specialization?: string;
    phone?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  }>;
  design7Chip: string;
  design7ExploreLink: string;
  design7MainHeading: string;
  design9MiniHeading: string;
  design9MainHeading: string;
  design9Description: string;
  design9Cards: Array<{
    heading?: string;
    description?: string;
    images?: WebpageImageAsset[];
  }>;
  createdAt?: string;
  updatedAt?: string;
};
