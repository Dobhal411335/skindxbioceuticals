export type SiteCodeDto = 'IN' | 'COM';

export type FooterImageRefDto = {
  url: string;
  publicId: string;
};

export type FooterLinkDto = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  order: number;
};

export type FooterColumnDto = {
  id: string;
  title: string;
  active: boolean;
  order: number;
  links: FooterLinkDto[];
};

export type FooterSocialLinkDto = {
  id: string;
  label: string;
  url: string;
  iconKey: string;
  active: boolean;
  order: number;
};

export type FooterConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  thankYou: string;
  description: string;
  logo: FooterImageRefDto;
  columns: FooterColumnDto[];
  socialLinks: FooterSocialLinkDto[];
  updatedAt: string | null;
};

export type FooterLinkRecord = {
  id: string;
  columnId: string;
  label: string;
  url: string;
  order: number;
  active: boolean;
};

export type FooterColumnRecord = {
  id: string;
  footerConfigId: string;
  title: string;
  order: number;
  active: boolean;
  links: FooterLinkRecord[];
};

export type FooterSocialLinkRecord = {
  id: string;
  footerConfigId: string;
  label: string;
  url: string;
  iconKey: string;
  order: number;
  active: boolean;
};

export type FooterConfigRecord = {
  id: string;
  siteId: string;
  thankYou: string;
  description: string;
  logoUrl: string;
  logoPublicId: string;
  updatedAt: Date;
  columns: FooterColumnRecord[];
  socialLinks: FooterSocialLinkRecord[];
};

export type FooterLinkWrite = {
  label: string;
  url: string;
  active: boolean;
  order: number;
};

export type FooterColumnWrite = {
  title: string;
  active: boolean;
  order: number;
  links: FooterLinkWrite[];
};

export type FooterSocialLinkWrite = {
  label: string;
  url: string;
  iconKey: string;
  active: boolean;
  order: number;
};

export type FooterConfigUpsertData = {
  thankYou: string;
  description: string;
  logoUrl: string;
  logoPublicId: string;
  columns: FooterColumnWrite[];
  socialLinks: FooterSocialLinkWrite[];
};
