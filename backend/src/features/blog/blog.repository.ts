import { prisma } from '@/lib/prisma';
import type {
  BlogCreateWrite,
  BlogPatchWrite,
  BlogRecord,
  BlogUpdateWrite,
} from './blog.types';

function mapBlog(row: {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  category: string;
  badgeText: string;
  stat1Number: string;
  stat1Name: string;
  stat1Text: string;
  stat2Number: string;
  stat2Name: string;
  stat2Text: string;
  title: string;
  publishedAt: Date;
  createdBy: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  blockquote: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BlogRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    name: row.name,
    slug: row.slug,
    category: row.category,
    badgeText: row.badgeText,
    stat1Number: row.stat1Number,
    stat1Name: row.stat1Name,
    stat1Text: row.stat1Text,
    stat2Number: row.stat2Number,
    stat2Name: row.stat2Name,
    stat2Text: row.stat2Text,
    title: row.title,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    description: row.description,
    blockquote: row.blockquote,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class BlogRepository {
  async listBySiteId(
    siteId: string,
    options?: { category?: string; activeOnly?: boolean; limit?: number },
  ): Promise<BlogRecord[]> {
    const rows = await prisma.blog.findMany({
      where: {
        siteId,
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.activeOnly ? { active: true } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      ...(options?.limit ? { take: options.limit } : {}),
    });
    return rows.map(mapBlog);
  }

  async listDistinctCategories(siteId: string, activeOnly = false): Promise<string[]> {
    const rows = await prisma.blog.findMany({
      where: {
        siteId,
        ...(activeOnly ? { active: true } : {}),
      },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((row) => row.category);
  }

  async findByIdForSite(siteId: string, blogId: string): Promise<BlogRecord | null> {
    const row = await prisma.blog.findFirst({
      where: { id: blogId, siteId },
    });
    return row ? mapBlog(row) : null;
  }

  async findBySlugForSite(
    siteId: string,
    slug: string,
    activeOnly = false,
  ): Promise<BlogRecord | null> {
    const row = await prisma.blog.findFirst({
      where: {
        siteId,
        slug,
        ...(activeOnly ? { active: true } : {}),
      },
    });
    return row ? mapBlog(row) : null;
  }

  async listRelatedByCategory(
    siteId: string,
    category: string,
    excludeId: string,
    limit = 4,
  ): Promise<BlogRecord[]> {
    const rows = await prisma.blog.findMany({
      where: {
        siteId,
        category,
        active: true,
        id: { not: excludeId },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return rows.map(mapBlog);
  }

  async slugExists(siteId: string, slug: string, excludeId?: string): Promise<boolean> {
    const row = await prisma.blog.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: BlogCreateWrite): Promise<BlogRecord> {
    const row = await prisma.blog.create({
      data: {
        siteId,
        name: data.name,
        slug: data.slug,
        category: data.category,
        badgeText: data.badgeText ?? '',
        stat1Number: data.stat1Number ?? '',
        stat1Name: data.stat1Name ?? '',
        stat1Text: data.stat1Text ?? '',
        stat2Number: data.stat2Number ?? '',
        stat2Name: data.stat2Name ?? '',
        stat2Text: data.stat2Text ?? '',
        title: data.title,
        publishedAt: data.publishedAt,
        createdBy: data.createdBy,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        description: data.description,
        blockquote: data.blockquote,
        active: data.active,
      },
    });
    return mapBlog(row);
  }

  async update(
    siteId: string,
    blogId: string,
    data: BlogUpdateWrite,
  ): Promise<BlogRecord | null> {
    const existing = await prisma.blog.findFirst({
      where: { id: blogId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.blog.update({
      where: { id: blogId },
      data: {
        name: data.name,
        slug: data.slug,
        category: data.category,
        badgeText: data.badgeText ?? '',
        stat1Number: data.stat1Number ?? '',
        stat1Name: data.stat1Name ?? '',
        stat1Text: data.stat1Text ?? '',
        stat2Number: data.stat2Number ?? '',
        stat2Name: data.stat2Name ?? '',
        stat2Text: data.stat2Text ?? '',
        title: data.title,
        publishedAt: data.publishedAt,
        createdBy: data.createdBy,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        description: data.description,
        blockquote: data.blockquote,
        active: data.active,
      },
    });
    return mapBlog(row);
  }

  async patch(
    siteId: string,
    blogId: string,
    data: BlogPatchWrite,
  ): Promise<BlogRecord | null> {
    const existing = await prisma.blog.findFirst({
      where: { id: blogId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await prisma.blog.update({
      where: { id: blogId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return mapBlog(row);
  }

  async delete(siteId: string, blogId: string): Promise<boolean> {
    const existing = await prisma.blog.findFirst({
      where: { id: blogId, siteId },
      select: { id: true },
    });
    if (!existing) {
      return false;
    }
    await prisma.blog.delete({ where: { id: blogId } });
    return true;
  }
}

export const blogRepository = new BlogRepository();
