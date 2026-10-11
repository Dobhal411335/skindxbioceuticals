export type SiteCodeDto = 'IN' | 'COM';

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

export type FooterConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  thankYou: string;
  description: string;
  columns: FooterColumnDto[];
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

export type FooterConfigRecord = {
  id: string;
  siteId: string;
  thankYou: string;
  description: string;
  updatedAt: Date;
  columns: FooterColumnRecord[];
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

export type FooterConfigUpsertData = {
  thankYou: string;
  description: string;
  columns: FooterColumnWrite[];
};
