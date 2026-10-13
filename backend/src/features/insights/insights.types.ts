export type SiteCodeDto = 'IN' | 'COM';

export type InsightCardDto = {
  id: string;
  category: string;
  name: string;
  publishedAt: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  order: number;
  active: boolean;
};

export type InsightQaDto = {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
};

export type InsightsConfigDto = {
  siteCode: SiteCodeDto;
  cards: InsightCardDto[];
  qaItems: InsightQaDto[];
};

export type InsightCardRecord = {
  id: string;
  siteId: string;
  category: string;
  name: string;
  publishedAt: Date;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  order: number;
  active: boolean;
};

export type InsightQaRecord = {
  id: string;
  siteId: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
};

export type InsightCardWrite = {
  category: string;
  name: string;
  publishedAt: Date;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  order: number;
  active: boolean;
};

export type InsightQaWrite = {
  question: string;
  answer: string;
  order: number;
  active: boolean;
};
