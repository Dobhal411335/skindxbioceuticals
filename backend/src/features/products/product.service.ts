import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import { categoryService, slugifyName } from '@/features/categories/category.service';
import { productRepository } from './product.repository';
import type {
  CatalogProductBody,
  CatalogProductPatchBody,
} from './product.validation';
import type { CatalogProductDto, ProductRecord, SiteCodeDto } from './product.types';

export function toCatalogProductDto(
  record: ProductRecord,
  siteCode: SiteCodeDto,
): CatalogProductDto {
  return {
    id: record.id,
    siteCode,
    subcategoryId: record.subcategoryId,
    productCode: record.productCode,
    name: record.name,
    slug: record.slug,
    description: record.description,
    active: record.status === 'ACTIVE',
    isFeatured: record.isFeatured,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class ProductService {
  constructor(
    private readonly repository = productRepository,
    private readonly categories = categoryService,
  ) {}

  private async uniqueProductSlug(
    siteId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugifyName(name);
    let candidate = base;
    let attempt = 1;
    while (await this.repository.slugExists(siteId, candidate, excludeId)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    return candidate;
  }

  async listForSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    subcategoryId: string;
  }): Promise<CatalogProductDto[]> {
    await this.categories.requireSubcategory(input.siteId, input.subcategoryId);
    const rows = await this.repository.listBySubcategory(
      input.siteId,
      input.subcategoryId,
    );
    return rows.map((row) => toCatalogProductDto(row, input.siteCode));
  }

  async createForSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    subcategoryId: string;
    body: CatalogProductBody;
  }): Promise<CatalogProductDto> {
    await this.categories.requireSubcategory(input.siteId, input.subcategoryId);

    if (await this.repository.productCodeExists(input.siteId, input.body.productCode)) {
      throw new ConflictError('A product with this code already exists for this site');
    }

    const slug = await this.uniqueProductSlug(input.siteId, input.body.name);
    const record = await this.repository.create(input.siteId, {
      subcategoryId: input.subcategoryId,
      productCode: input.body.productCode,
      name: input.body.name,
      slug,
      description: input.body.description ?? null,
      status: input.body.active ? 'ACTIVE' : 'DRAFT',
      isFeatured: false,
    });

    logger.info(
      {
        event: 'catalog_product.created',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: record.id,
        subcategoryId: input.subcategoryId,
      },
      'Catalog product created',
    );

    return toCatalogProductDto(record, input.siteCode);
  }

  async updateForSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    subcategoryId: string;
    productId: string;
    body: CatalogProductBody;
  }): Promise<CatalogProductDto> {
    await this.categories.requireSubcategory(input.siteId, input.subcategoryId);

    const existing = await this.repository.findByIdForSite(input.siteId, input.productId);
    if (!existing || existing.subcategoryId !== input.subcategoryId) {
      throw new NotFoundError('Product not found');
    }

    if (
      await this.repository.productCodeExists(
        input.siteId,
        input.body.productCode,
        existing.id,
      )
    ) {
      throw new ConflictError('A product with this code already exists for this site');
    }

    const slug =
      existing.name === input.body.name
        ? existing.slug
        : await this.uniqueProductSlug(input.siteId, input.body.name, existing.id);

    const record = await this.repository.update(input.siteId, input.productId, {
      subcategoryId: input.subcategoryId,
      productCode: input.body.productCode,
      name: input.body.name,
      slug,
      description: input.body.description ?? existing.description,
      status: input.body.active ? 'ACTIVE' : 'DRAFT',
      isFeatured: existing.isFeatured,
    });
    if (!record) {
      throw new NotFoundError('Product not found');
    }

    logger.info(
      {
        event: 'catalog_product.updated',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: record.id,
      },
      'Catalog product updated',
    );

    return toCatalogProductDto(record, input.siteCode);
  }

  async patchForSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    subcategoryId: string;
    productId: string;
    body: CatalogProductPatchBody;
  }): Promise<CatalogProductDto> {
    await this.categories.requireSubcategory(input.siteId, input.subcategoryId);

    const existing = await this.repository.findByIdForSite(input.siteId, input.productId);
    if (!existing || existing.subcategoryId !== input.subcategoryId) {
      throw new NotFoundError('Product not found');
    }

    if (
      input.body.productCode &&
      (await this.repository.productCodeExists(
        input.siteId,
        input.body.productCode,
        existing.id,
      ))
    ) {
      throw new ConflictError('A product with this code already exists for this site');
    }

    let slug: string | undefined;
    if (input.body.name && input.body.name !== existing.name) {
      slug = await this.uniqueProductSlug(input.siteId, input.body.name, existing.id);
    }

    const record = await this.repository.patch(input.siteId, input.productId, {
      ...(input.body.productCode !== undefined
        ? { productCode: input.body.productCode }
        : {}),
      ...(input.body.name !== undefined ? { name: input.body.name } : {}),
      ...(slug ? { slug } : {}),
      ...(input.body.active !== undefined
        ? { status: input.body.active ? 'ACTIVE' : 'DRAFT' }
        : {}),
    });
    if (!record) {
      throw new NotFoundError('Product not found');
    }

    logger.info(
      {
        event: 'catalog_product.patched',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: record.id,
        active: record.status === 'ACTIVE',
      },
      'Catalog product patched',
    );

    return toCatalogProductDto(record, input.siteCode);
  }

  async deleteForSubcategory(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    subcategoryId: string;
    productId: string;
  }): Promise<void> {
    await this.categories.requireSubcategory(input.siteId, input.subcategoryId);

    const existing = await this.repository.findByIdForSite(input.siteId, input.productId);
    if (!existing || existing.subcategoryId !== input.subcategoryId) {
      throw new NotFoundError('Product not found');
    }

    const deleted = await this.repository.delete(input.siteId, input.productId);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }

    logger.info(
      {
        event: 'catalog_product.deleted',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: input.productId,
      },
      'Catalog product deleted',
    );
  }
}

export const productService = new ProductService();
