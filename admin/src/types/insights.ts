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
  siteCode: "IN" | "COM";
  cards: InsightCardDto[];
  qaItems: InsightQaDto[];
};

export type InsightCardFormValues = {
  category: string;
  name: string;
  /** YYYY-MM-DD for date input */
  publishedAt: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  order: string;
  active: boolean;
};

export type InsightQaFormValues = {
  question: string;
  answer: string;
  order: string;
  active: boolean;
};

export type InsightsFormValues = {
  cards: InsightCardFormValues[];
  qaItems: InsightQaFormValues[];
};

export type InsightsConfigPayload = {
  cards: Array<{
    category: string;
    name: string;
    publishedAt: string;
    imageUrl: string;
    imagePublicId: string;
    description: string;
    order: number;
    active: boolean;
  }>;
  qaItems: Array<{
    question: string;
    answer: string;
    order: number;
    active: boolean;
  }>;
};
