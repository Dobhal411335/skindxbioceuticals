import { Prisma, type ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const priceProductInclude = {
  subcategory: {
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: { select: { id: true, name: true } },
    },
  },
  galleryImages: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: 1,
    select: { imageUrl: true, isPrimary: true },
  },
  variants: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      name: true,
      price: true,
      compareAtPrice: true,
      vendorPrice: true,
      currency: true,
      sizeLabel: true,
      colorLabel: true,
      isActive: true,
      profileImageUrl: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type PriceProductRow = Prisma.ProductGetPayload<{
  include: typeof priceProductInclude;
}>;

export type PriceVariantUpdate = {
  id: string;
  price: number;
  vendorPrice: number | null;
  compareAtPrice: number | null;
};

/**
 * Product-prices repository — Prisma access for admin percent price updates.
 */
export class ProductPricesRepository {
  protected readonly db = prisma;

  buildWhere(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
      productId?: string;
    },
  ): Prisma.ProductWhereInput {
    const q = options.q?.trim();
    return {
      siteId,
      ...(options.productId ? { id: options.productId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.subcategoryId ? { subcategoryId: options.subcategoryId } : {}),
      ...(options.categoryId && !options.subcategoryId
        ? { subcategory: { parentId: options.categoryId } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { productCode: { contains: q, mode: 'insensitive' as const } },
              { slug: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  async listForPrices(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
      productId?: string;
      skip: number;
      take: number;
    },
  ): Promise<PriceProductRow[]> {
    return this.db.product.findMany({
      where: this.buildWhere(siteId, options),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: options.skip,
      take: options.take,
      include: priceProductInclude,
    });
  }

  async countForPrices(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
      productId?: string;
    },
  ): Promise<number> {
    return this.db.product.count({
      where: this.buildWhere(siteId, options),
    });
  }

  async listAllMatching(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
      productId?: string;
    },
  ): Promise<PriceProductRow[]> {
    return this.db.product.findMany({
      where: this.buildWhere(siteId, options),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: priceProductInclude,
    });
  }

  async findRootCategoryForSite(
    siteId: string,
    categoryId: string,
  ): Promise<{ id: string } | null> {
    return this.db.category.findFirst({
      where: { id: categoryId, siteId, parentId: null },
      select: { id: true },
    });
  }

  async findSubcategoryUnderParent(
    siteId: string,
    categoryId: string,
    subcategoryId: string,
  ): Promise<{ id: string } | null> {
    return this.db.category.findFirst({
      where: {
        id: subcategoryId,
        siteId,
        parentId: categoryId,
      },
      select: { id: true },
    });
  }

  async findProductForSite(siteId: string, productId: string): Promise<{ id: string } | null> {
    return this.db.product.findFirst({
      where: { id: productId, siteId },
      select: { id: true },
    });
  }

  /**
   * Applies recomputed variant prices in one transaction.
   * Caller must compute amounts server-side from percent + current DB values.
   */
  async applyVariantPriceUpdates(updates: PriceVariantUpdate[]): Promise<void> {
    if (updates.length === 0) return;

    await this.db.$transaction(
      updates.map((row) =>
        this.db.productVariant.update({
          where: { id: row.id },
          data: {
            price: new Prisma.Decimal(row.price.toFixed(2)),
            vendorPrice:
              row.vendorPrice == null ? null : new Prisma.Decimal(row.vendorPrice.toFixed(2)),
            compareAtPrice:
              row.compareAtPrice == null ? null : new Prisma.Decimal(row.compareAtPrice.toFixed(2)),
          },
        }),
      ),
    );
  }
}

export const productPricesRepository = new ProductPricesRepository();
