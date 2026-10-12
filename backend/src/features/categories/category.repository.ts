import { prisma } from '@/lib/prisma';
import type { CategoryRecord, CategoryWrite } from './category.types';

function toRecord(row: {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): CategoryRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parentId,
    bannerUrl: row.bannerUrl,
    bannerPublicId: row.bannerPublicId,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CategoryRepository {
  async listRootsBySiteId(siteId: string): Promise<CategoryRecord[]> {
    const rows = await prisma.category.findMany({
      where: { siteId, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listActiveRootsBySiteId(siteId: string): Promise<CategoryRecord[]> {
    const rows = await prisma.category.findMany({
      where: { siteId, parentId: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listChildrenByParentId(
    siteId: string,
    parentId: string,
  ): Promise<CategoryRecord[]> {
    const rows = await prisma.category.findMany({
      where: { siteId, parentId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listActiveChildrenByParentId(
    siteId: string,
    parentId: string,
  ): Promise<CategoryRecord[]> {
    const rows = await prisma.category.findMany({
      where: { siteId, parentId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async findByIdForSite(siteId: string, categoryId: string): Promise<CategoryRecord | null> {
    const row = await prisma.category.findFirst({
      where: { id: categoryId, siteId },
    });
    return row ? toRecord(row) : null;
  }

  async findRootBySlugOrName(
    siteId: string,
    slugOrName: string,
  ): Promise<CategoryRecord | null> {
    const normalized = slugOrName.trim();
    const row = await prisma.category.findFirst({
      where: {
        siteId,
        parentId: null,
        isActive: true,
        OR: [
          { slug: normalized },
          { name: { equals: normalized, mode: 'insensitive' } },
        ],
      },
    });
    return row ? toRecord(row) : null;
  }

  async nextRootOrder(siteId: string): Promise<number> {
    const aggregate = await prisma.category.aggregate({
      where: { siteId, parentId: null },
      _max: { sortOrder: true },
    });
    return (aggregate._max.sortOrder ?? 0) + 1;
  }

  async nextChildOrder(siteId: string, parentId: string): Promise<number> {
    const aggregate = await prisma.category.aggregate({
      where: { siteId, parentId },
      _max: { sortOrder: true },
    });
    return (aggregate._max.sortOrder ?? 0) + 1;
  }

  async slugExists(
    siteId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const row = await prisma.category.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: CategoryWrite): Promise<CategoryRecord> {
    const row = await prisma.category.create({
      data: {
        siteId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        bannerUrl: data.bannerUrl,
        bannerPublicId: data.bannerPublicId,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
    return toRecord(row);
  }

  async update(
    siteId: string,
    categoryId: string,
    data: CategoryWrite,
  ): Promise<CategoryRecord | null> {
    const existing = await this.findByIdForSite(siteId, categoryId);
    if (!existing) return null;

    const row = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        bannerUrl: data.bannerUrl,
        bannerPublicId: data.bannerPublicId,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
    return toRecord(row);
  }

  async patch(
    siteId: string,
    categoryId: string,
    data: Partial<Pick<CategoryWrite, 'isActive' | 'sortOrder' | 'name' | 'slug'>>,
  ): Promise<CategoryRecord | null> {
    const existing = await this.findByIdForSite(siteId, categoryId);
    if (!existing) return null;

    const row = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
      },
    });
    return toRecord(row);
  }

  async countProductsForCategory(categoryId: string): Promise<number> {
    return prisma.product.count({
      where: { subcategoryId: categoryId },
    });
  }

  async countChildren(categoryId: string): Promise<number> {
    return prisma.category.count({
      where: { parentId: categoryId },
    });
  }

  async delete(siteId: string, categoryId: string): Promise<boolean> {
    const existing = await this.findByIdForSite(siteId, categoryId);
    if (!existing) return false;
    await prisma.category.delete({ where: { id: categoryId } });
    return true;
  }
}

export const categoryRepository = new CategoryRepository();
