export type SiteCodeDto = 'IN' | 'COM';

export type FaqItemDto = {
  id: string;
  question: string;
  answer: string;
  showOnLanding: boolean;
  active: boolean;
  order: number;
};

export type FaqSectionDto = {
  id: string;
  title: string;
  active: boolean;
  order: number;
  items: FaqItemDto[];
};

export type FaqConfigDto = {
  siteCode: SiteCodeDto;
  sections: FaqSectionDto[];
};

export type FaqItemRecord = {
  id: string;
  sectionId: string;
  question: string;
  answer: string;
  showOnLanding: boolean;
  order: number;
  active: boolean;
};

export type FaqSectionRecord = {
  id: string;
  siteId: string;
  title: string;
  order: number;
  active: boolean;
  items: FaqItemRecord[];
};

export type FaqItemWrite = {
  question: string;
  answer: string;
  showOnLanding: boolean;
  active: boolean;
  order: number;
};

export type FaqSectionWrite = {
  title: string;
  active: boolean;
  order: number;
  items: FaqItemWrite[];
};
