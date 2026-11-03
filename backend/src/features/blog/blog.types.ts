import type { SiteCode } from '@/types/common';

export type SiteCodeDto = SiteCode;

export type BlogAccordionItem = {
  question: string;
  description: string;
};

export type BlogDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  accordionItems: BlogAccordionItem[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPublicDto = {
  id: string;
  siteCode: SiteCodeDto;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  description: string;
  blockquote: string;
  accordionItems: BlogAccordionItem[];
  createdAt: string;
};

/** Lightweight card for related / recent lists (no HTML body). */
export type BlogCardDto = {
  id: string;
  slug: string;
  name: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
};

export type BlogDetailPublicDto = BlogPublicDto & {
  related: BlogCardDto[];
};

export type BlogRecord = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  accordionItems: BlogAccordionItem[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogCreateWrite = {
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  accordionItems: BlogAccordionItem[];
  active: boolean;
};

export type BlogUpdateWrite = {
  name: string;
  slug: string;
  category: string;
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  accordionItems: BlogAccordionItem[];
  active: boolean;
};

export type BlogPatchWrite = {
  name?: string;
  active?: boolean;
};

export function parseBlogAccordionItems(value: unknown): BlogAccordionItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: BlogAccordionItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const question =
      typeof row.question === 'string'
        ? row.question.trim()
        : typeof row.left === 'string'
          ? row.left.trim()
          : '';
    const description =
      typeof row.description === 'string'
        ? row.description.trim()
        : typeof row.right === 'string'
          ? row.right.trim()
          : typeof row.answer === 'string'
            ? row.answer.trim()
            : '';
    if (!question && !description) {
      continue;
    }
    items.push({ question, description });
  }
  return items;
}
