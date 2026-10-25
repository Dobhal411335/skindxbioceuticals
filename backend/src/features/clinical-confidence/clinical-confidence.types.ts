export type SiteCodeDto = 'IN' | 'COM';

export type ClinicalConfidenceCardDto = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: number;
  active: boolean;
};

export type ClinicalConfidenceConfigDto = {
  id: string | null;
  siteCode: SiteCodeDto;
  badgeText: string;
  heading: string;
  description: string;
  button1Label: string;
  button1Url: string;
  button2Label: string;
  button2Url: string;
  backgroundImageUrl: string;
  backgroundImagePublicId: string;
  cards: ClinicalConfidenceCardDto[];
  updatedAt: string | null;
};

export type ClinicalConfidenceConfigBody = Omit<
  ClinicalConfidenceConfigDto,
  'id' | 'siteCode' | 'cards' | 'updatedAt'
> & {
  cards: Array<Omit<ClinicalConfidenceCardDto, 'id' | 'sortOrder'> & { sortOrder?: number }>;
};

export type ClinicalConfidenceConfigRecord = Omit<
  ClinicalConfidenceConfigDto,
  'id' | 'siteCode' | 'cards' | 'updatedAt'
> & {
  id: string;
  siteId: string;
  updatedAt: Date;
  cards: Array<ClinicalConfidenceCardDto>;
};
