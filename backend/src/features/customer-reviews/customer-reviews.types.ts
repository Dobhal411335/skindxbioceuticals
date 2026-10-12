import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type CustomerReviewDto = {
  id: string;
  siteCode: SiteCodeDto;
  customerName: string;
  designation: string;
  description: string;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerReviewRecord = {
  id: string;
  siteId: string;
  customerName: string;
  designation: string;
  description: string;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerReviewWrite = {
  customerName: string;
  designation: string;
  description: string;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  active: boolean;
  order: number;
};
