import {
  deleteStoredCloudinaryAsset,
  deleteStoredCloudinaryAssetBestEffort,
} from '@/lib/cloudinary';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/AppError';
import { productRepository } from '@/features/products/product.repository';
import { categoryRepository } from './category.repository';
import type {
  CategoryBody,
  CategoryPatchBody,
  SubcategoryBody,
  SubcategoryPatchBody,
} from './category.validation';
import type {
  CategoryDto,
  CategoryRecord,
  CategoryWrite,
  PublicCategoryDetailDto,
  PublicCategoryDto,
  SiteCodeDto,
} from './category.types';

function preferHttpsUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

export function slugifyName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
  return slug || 'category';
}

export function toCategoryDto(record: CategoryRecord, siteCode: SiteCodeDto): CategoryDto {
  return {
    id: record.id,
    siteCode,
    name: record.name,
    slug: record.slug,
    description: record.description,
    parentId: record.parentId,
    bannerUrl: preferHttpsUrl(record.bannerUrl),
    bannerPublicId: record.bannerPublicId,
    active: record.isActive,
    order: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class CategoryService {
  constructor(
    private readonly repository = categoryRepository,
    private readonly products = productRepository,
  ) {}

  private async uniqueSlug(
    siteId: string,
    baseName: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugifyName(baseName);
    let candidate = base;
    let attempt = 1;
    while (await this.repository.slugExists(siteId, candidate, excludeId)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    return candidate;
  }

  async listRoots(siteId: string, siteCode: SiteCode): Promise<CategoryDto[]> {
    const rows = await this.repository.listRootsBySiteId(siteId);
    return rows.map((row) => toCategoryDto(row, siteCode));
  }

  async listActiveRoots(siteId: string, siteCode: SiteCode): Promise<PublicCategoryDto[]> {
    const rows = await this.repository.listActiveRootsBySiteId(siteId);
    return rows.map((row) => ({
      id: row.id,
      siteCode,
      name: row.name,
      slug: row.slug,
      bannerUrl: preferHttpsUrl(row.bannerUrl),
      order: row.sortOrder,
    }));
  }

  async getPublicBySlugOrName(
    siteId: string,
    siteCode: SiteCode,
    slugOrName: string,
  ): Promise<PublicCategoryDetailDto> {
    const category = await this.repository.findRootBySlugOrName(siteId, slugOrName);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const subcategories = await this.repository.listActiveChildrenByParentId(
      siteId,
      category.id,
    );

    const withProducts = await Promise.all(
      subcategories.map(async (sub) => {
        const products = await this.products.listActiveBySubcategory(siteId, sub.id);
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          order: sub.sortOrder,
          products: products.map((product) => ({
            id: product.id,
            productCode: product.productCode,
            name: product.name,
            slug: product.slug,
            active: product.status === 'ACTIVE',
          })),
        };
      }),
    );

    return {
      id: category.id,
      siteCode,
      name: category.name,
      slug: category.slug,
      bannerUrl: preferHttpsUrl(category.bannerUrl),
      order: category.sortOrder,
      description: category.description,
      subcategories: withProducts,
    };
  }

  async createRoot(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: CategoryBody;
  }): Promise<CategoryDto> {
    const order =
      input.body.order ?? (await this.repository.nextRootOrder(input.siteId));
    const slug = await this.uniqueSlug(input.siteId, input.body.name);
    const data: CategoryWrite = {
      name: input.body.name,
      slug,
      description: input.body.description ?? null,
      parentId: null,
      bannerUrl: preferHttpsUrl(input.body.bannerUrl),
      bannerPublicId: input.body.bannerPublicId ?? '',
      isActive: input.body.active,
      sortOrder: order,
    };

    const record = await this.repository.create(input.siteId, data);

    logger.info(
      {
        event: 'category.created',
        siteCode: input.siteCode,
        userId: input.userId,
        categoryId: record.id,
      },
      'Category created',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async updateRoot(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    body: CategoryBody;
  }): Promise<CategoryDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.categoryId);
    if (!existing || existing.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const slug =
      existing.name === input.body.name
        ? existing.slug
        : await this.uniqueSlug(input.siteId, input.body.name, existing.id);

    const data: CategoryWrite = {
      name: input.body.name,
      slug,
      description: input.body.description ?? existing.description,
      parentId: null,
      bannerUrl: preferHttpsUrl(input.body.bannerUrl),
      bannerPublicId: input.body.bannerPublicId ?? '',
      isActive: input.body.active,
      sortOrder: input.body.order ?? existing.sortOrder,
    };

    const record = await this.repository.update(input.siteId, input.categoryId, data);
    if (!record) {
      throw new NotFoundError('Category not found');
    }

    const previousPublicId = (existing.bannerPublicId ?? '').trim();
    const nextPublicId = (data.bannerPublicId ?? '').trim();
    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredCloudinaryAssetBestEffort(previousPublicId);
    }

    logger.info(
      {
        event: 'category.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        categoryId: record.id,
      },
      'Category updated',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async patchRoot(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    body: CategoryPatchBody;
  }): Promise<CategoryDto> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.categoryId);
    if (!existing || existing.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const record = await this.repository.patch(input.siteId, input.categoryId, {
      ...(input.body.active !== undefined ? { isActive: input.body.active } : {}),
      ...(input.body.order !== undefined ? { sortOrder: input.body.order } : {}),
    });
    if (!record) {
      throw new NotFoundError('Category not found');
    }

    logger.info(
      {
        event: 'category.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        categoryId: record.id,
        active: record.isActive,
      },
      'Category patched',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async deleteRoot(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.categoryId);
    if (!existing || existing.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const childCount = await this.repository.countChildren(input.categoryId);
    if (childCount > 0) {
      throw new ConflictError('Delete subcategories before deleting this category');
    }

    if ((existing.bannerPublicId ?? '').trim()) {
      await deleteStoredCloudinaryAsset(existing.bannerPublicId!);
    }

    const deleted = await this.repository.delete(input.siteId, input.categoryId);
    if (!deleted) {
      throw new NotFoundError('Category not found');
    }

    logger.info(
      {
        event: 'category.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        categoryId: input.categoryId,
      },
      'Category deleted',
    );
  }

  async listSubcategories(
    siteId: string,
    siteCode: SiteCode,
    categoryId: string,
  ): Promise<CategoryDto[]> {
    const parent = await this.repository.findByIdForSite(siteId, categoryId);
    if (!parent || parent.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const rows = await this.repository.listChildrenByParentId(siteId, categoryId);
    return rows.map((row) => toCategoryDto(row, siteCode));
  }

  async createSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    body: SubcategoryBody;
  }): Promise<CategoryDto> {
    const parent = await this.repository.findByIdForSite(input.siteId, input.categoryId);
    if (!parent || parent.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const order =
      input.body.order ??
      (await this.repository.nextChildOrder(input.siteId, input.categoryId));
    const slug = await this.uniqueSlug(input.siteId, input.body.name);

    const record = await this.repository.create(input.siteId, {
      name: input.body.name,
      slug,
      description: null,
      parentId: input.categoryId,
      bannerUrl: null,
      bannerPublicId: null,
      isActive: input.body.active,
      sortOrder: order,
    });

    logger.info(
      {
        event: 'subcategory.created',
        siteCode: input.siteCode,
        userId: input.userId,
        categoryId: input.categoryId,
        subcategoryId: record.id,
      },
      'Subcategory created',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async updateSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    subcategoryId: string;
    body: SubcategoryBody;
  }): Promise<CategoryDto> {
    const parent = await this.repository.findByIdForSite(input.siteId, input.categoryId);
    if (!parent || parent.parentId !== null) {
      throw new NotFoundError('Category not found');
    }

    const existing = await this.repository.findByIdForSite(
      input.siteId,
      input.subcategoryId,
    );
    if (!existing || existing.parentId !== input.categoryId) {
      throw new NotFoundError('Subcategory not found');
    }

    const slug =
      existing.name === input.body.name
        ? existing.slug
        : await this.uniqueSlug(input.siteId, input.body.name, existing.id);

    const record = await this.repository.update(input.siteId, input.subcategoryId, {
      name: input.body.name,
      slug,
      description: null,
      parentId: input.categoryId,
      bannerUrl: null,
      bannerPublicId: null,
      isActive: input.body.active,
      sortOrder: input.body.order ?? existing.sortOrder,
    });
    if (!record) {
      throw new NotFoundError('Subcategory not found');
    }

    logger.info(
      {
        event: 'subcategory.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        subcategoryId: record.id,
      },
      'Subcategory updated',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async patchSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    subcategoryId: string;
    body: SubcategoryPatchBody;
  }): Promise<CategoryDto> {
    const existing = await this.repository.findByIdForSite(
      input.siteId,
      input.subcategoryId,
    );
    if (!existing || existing.parentId !== input.categoryId) {
      throw new NotFoundError('Subcategory not found');
    }

    let slug: string | undefined;
    if (input.body.name && input.body.name !== existing.name) {
      slug = await this.uniqueSlug(input.siteId, input.body.name, existing.id);
    }

    const record = await this.repository.patch(input.siteId, input.subcategoryId, {
      ...(input.body.active !== undefined ? { isActive: input.body.active } : {}),
      ...(input.body.order !== undefined ? { sortOrder: input.body.order } : {}),
      ...(input.body.name !== undefined ? { name: input.body.name } : {}),
      ...(slug ? { slug } : {}),
    });
    if (!record) {
      throw new NotFoundError('Subcategory not found');
    }

    logger.info(
      {
        event: 'subcategory.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        subcategoryId: record.id,
      },
      'Subcategory patched',
    );

    return toCategoryDto(record, input.siteCode);
  }

  async deleteSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    categoryId: string;
    subcategoryId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(
      input.siteId,
      input.subcategoryId,
    );
    if (!existing || existing.parentId !== input.categoryId) {
      throw new NotFoundError('Subcategory not found');
    }

    const productCount = await this.repository.countProductsForCategory(
      input.subcategoryId,
    );
    if (productCount > 0) {
      throw new ConflictError('Delete products before deleting this subcategory');
    }

    const deleted = await this.repository.delete(input.siteId, input.subcategoryId);
    if (!deleted) {
      throw new NotFoundError('Subcategory not found');
    }

    logger.info(
      {
        event: 'subcategory.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        subcategoryId: input.subcategoryId,
      },
      'Subcategory deleted',
    );
  }

  /** Ensures a subcategory belongs to the site (used by product APIs). */
  async requireSubcategory(siteId: string, subcategoryId: string): Promise<CategoryRecord> {
    const record = await this.repository.findByIdForSite(siteId, subcategoryId);
    if (!record || !record.parentId) {
      throw new ValidationError('Subcategory not found for this site');
    }
    return record;
  }
}

export const categoryService = new CategoryService();
