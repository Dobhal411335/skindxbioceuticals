import type { SiteCode } from "@/types/auth";

export type BlogDto = {
  id: string;
  siteCode: SiteCode;
  name: string;
  slug: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogCreatePayload = {
  name: string;
  category: string;
  slug?: string;
  active?: boolean;
};

export type BlogUpdatePayload = {
  name: string;
  slug: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
};

export type BlogCreateFormValues = {
  name: string;
  category: string;
  slug: string;
};

export type BlogEditFormValues = {
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
};
