export type SiteCodeDto = 'IN' | 'COM';

export type TopAdvertisementSectionDto = 'ANNOUNCEMENT' | 'UTILITY' | 'BENEFIT';

export type TopAdvertisementItemDto = {
  id: string;
  section: TopAdvertisementSectionDto;
  text: string;
  url: string;
  active: boolean;
};

export type TopAdvertisementConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  announcements: TopAdvertisementItemDto[];
  utilityItems: TopAdvertisementItemDto[];
  benefits: TopAdvertisementItemDto[];
  updatedAt: string | null;
};

export type TopAdvertisementItemRecord = {
  id: string;
  configId: string;
  section: TopAdvertisementSectionDto;
  text: string;
  url: string;
  active: boolean;
};

export type TopAdvertisementConfigRecord = {
  id: string;
  siteId: string;
  updatedAt: Date;
  items: TopAdvertisementItemRecord[];
};

export type TopAdvertisementItemWrite = {
  section: TopAdvertisementSectionDto;
  text: string;
  url: string;
  active: boolean;
};

export type TopAdvertisementConfigUpsertData = {
  items: TopAdvertisementItemWrite[];
};
