import type { ProductStatus, ProductType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ProductRecord, ProductWrite } from './product.types';

function toRecord(row: {
  id: string;
  siteId: string;
  subcategoryId: string | null;
  productType: ProductType;
  productCode: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductRecord {
  return {
    id: row.id,
    siteId: row.siteId,
    subcategoryId: row.subcategoryId,
    productType: row.productType,
    productCode: row.productCode,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    isFeatured: row.isFeatured,
    isRecent: row.isRecent,
    isBestSeller: row.isBestSeller,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProductRepository {
  async listBySubcategory(siteId: string, subcategoryId: string): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: { siteId, subcategoryId, productType: 'CATEGORY' },
      // Oldest products first; latest created appear at the bottom.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listByProductType(siteId: string, productType: ProductType): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: { siteId, productType },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async listActiveBySubcategory(siteId: string, subcategoryId: string): Promise<ProductRecord[]> {
    const rows = await prisma.product.findMany({
      where: { siteId, subcategoryId, status: 'ACTIVE', productType: 'CATEGORY' },
      orderBy: [{ name: 'asc' }],
    });
    return rows.map(toRecord);
  }

  private readonly publicCardInclude = {
    subcategory: { select: { name: true, parentId: true, slug: true } },
    galleryImages: {
      orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
      take: 1,
    },
    variants: {
      where: { isActive: true },
      orderBy: { createdAt: 'asc' as const },
      take: 1,
      include: { inventory: true },
    },
    editorialReviews: {
      where: { active: true },
      select: { rating: true },
    },
    reviews: {
      where: { isApproved: true },
      select: { rating: true },
    },
    coupon: { include: { coupon: true } },
    tax: true,
  };

  async listActivePublicCards(siteId: string, options: { limit: number }) {
    return prisma.product.findMany({
      where: { siteId, status: 'ACTIVE' },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }, { name: 'asc' }],
      take: options.limit,
      include: this.publicCardInclude,
    });
  }

  /**
   * ACTIVE products for shop PLP filtering (category + text search only at DB layer).
   * Price / stock / sort / pagination are applied in the service against first-variant cards.
   */
  async listActiveCatalogCandidates(
    siteId: string,
    options: { categorySlug?: string; q?: string },
  ) {
    const q = options.q?.trim();
    return prisma.product.findMany({
      where: {
        siteId,
        status: 'ACTIVE',
        ...(options.categorySlug
          ? {
              subcategory: {
                isActive: true,
                parent: {
                  isActive: true,
                  parentId: null,
                  slug: options.categorySlug,
                },
              },
            }
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
      },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }, { name: 'asc' }],
      include: this.publicCardInclude,
    });
  }

  async listPublicFacets(siteId: string) {
    const roots = await prisma.category.findMany({
      where: { siteId, parentId: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            catalogProducts: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                galleryImages: {
                  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    const priceRows = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { siteId, status: 'ACTIVE' },
      },
      orderBy: [{ productId: 'asc' }, { createdAt: 'asc' }],
      select: {
        price: true,
        productId: true,
      },
    });

    return { roots, priceRows };
  }

  async listActivePublicByFlag(
    siteId: string,
    flag: 'isRecent' | 'isFeatured' | 'isBestSeller',
    options: { limit: number },
  ) {
    return prisma.product.findMany({
      where: {
        siteId,
        status: 'ACTIVE',
        [flag]: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      take: options.limit,
      // Same card payload as rail/PLP so coupon + tax discounts render on highlights.
      include: this.publicCardInclude,
    });
  }

  async findByIdForSite(siteId: string, productId: string): Promise<ProductRecord | null> {
    const row = await prisma.product.findFirst({
      where: { id: productId, siteId },
    });
    return row ? toRecord(row) : null;
  }

  async findActivePublicBySlug(siteId: string, slug: string) {
    return prisma.product.findFirst({
      where: { siteId, slug, status: 'ACTIVE' },
      include: {
        sizes: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        colors: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        galleryImages: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        videos: { orderBy: { sortOrder: 'asc' } },
        infoSections: { orderBy: { sortOrder: 'asc' } },
        editorialReviews: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
        highlights: { orderBy: { sortOrder: 'asc' } },
        tax: true,
        coupon: { include: { coupon: true } },
        tags: { include: { tag: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: { inventory: true },
        },
      },
    });
  }

  async listRelatedActive(
    siteId: string,
    options: {
      excludeProductId: string;
      subcategoryId: string | null;
      /** When omitted, returns every ACTIVE product in the subcategory except the current. */
      limit?: number;
    },
  ) {
    if (!options.subcategoryId) {
      return [];
    }

    return prisma.product.findMany({
      where: {
        siteId,
        status: 'ACTIVE',
        subcategoryId: options.subcategoryId,
        id: { not: options.excludeProductId },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      ...(options.limit != null ? { take: options.limit } : {}),
      // Same card payload as rail/PLP so FBT cards can show category, ratings, coupon.
      include: this.publicCardInclude,
    });
  }

  async productCodeExists(
    siteId: string,
    productCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const row = await prisma.product.findFirst({
      where: {
        siteId,
        productCode,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async slugExists(siteId: string, slug: string, excludeId?: string): Promise<boolean> {
    const row = await prisma.product.findFirst({
      where: {
        siteId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(siteId: string, data: ProductWrite): Promise<ProductRecord> {
    const row = await prisma.product.create({
      data: {
        siteId,
        subcategoryId: data.subcategoryId,
        productType: data.productType,
        productCode: data.productCode,
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        isFeatured: data.isFeatured,
        isRecent: data.isRecent,
        isBestSeller: data.isBestSeller,
        ...(data.subcategoryId
          ? {
              categories: {
                create: [{ categoryId: data.subcategoryId }],
              },
            }
          : {}),
      },
    });
    return toRecord(row);
  }

  async update(
    siteId: string,
    productId: string,
    data: ProductWrite,
  ): Promise<ProductRecord | null> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { productId } });
      if (data.subcategoryId) {
        await tx.productCategory.create({
          data: { productId, categoryId: data.subcategoryId },
        });
      }
      return tx.product.update({
        where: { id: productId },
        data: {
          subcategoryId: data.subcategoryId,
          productType: data.productType,
          productCode: data.productCode,
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: data.status,
          isFeatured: data.isFeatured,
          isRecent: data.isRecent,
          isBestSeller: data.isBestSeller,
        },
      });
    });

    return toRecord(row);
  }

  async patch(
    siteId: string,
    productId: string,
    data: Partial<{
      productCode: string;
      name: string;
      slug: string;
      status: ProductStatus;
      isFeatured: boolean;
      isRecent: boolean;
      isBestSeller: boolean;
    }>,
  ): Promise<ProductRecord | null> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return null;

    const row = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.productCode !== undefined ? { productCode: data.productCode } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.isRecent !== undefined ? { isRecent: data.isRecent } : {}),
        ...(data.isBestSeller !== undefined ? { isBestSeller: data.isBestSeller } : {}),
      },
    });
    return toRecord(row);
  }

  async delete(siteId: string, productId: string): Promise<boolean> {
    const existing = await this.findByIdForSite(siteId, productId);
    if (!existing) return false;
    await prisma.product.delete({ where: { id: productId } });
    return true;
  }

  /**
   * Site-scoped admin list with optional createdAt window, status, and text search.
   * Newest products first for the View All Products table.
   */
  async listForAdminSite(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      createdFrom?: Date;
      createdTo?: Date;
      skip: number;
      take: number;
    },
  ) {
    const q = options.q?.trim();
    return prisma.product.findMany({
      where: {
        siteId,
        ...(options.status ? { status: options.status } : {}),
        ...(options.createdFrom || options.createdTo
          ? {
              createdAt: {
                ...(options.createdFrom ? { gte: options.createdFrom } : {}),
                ...(options.createdTo ? { lte: options.createdTo } : {}),
              },
            }
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
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: options.skip,
      take: options.take,
      include: {
        subcategory: { select: { name: true } },
        galleryImages: {
          orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
          take: 1,
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' as const },
          take: 1,
          select: {
            price: true,
            vendorPrice: true,
            currency: true,
            inventory: { select: { quantityOnHand: true } },
          },
        },
      },
    });
  }

  async countForAdminSite(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      createdFrom?: Date;
      createdTo?: Date;
    },
  ): Promise<number> {
    const q = options.q?.trim();
    return prisma.product.count({
      where: {
        siteId,
        ...(options.status ? { status: options.status } : {}),
        ...(options.createdFrom || options.createdTo
          ? {
              createdAt: {
                ...(options.createdFrom ? { gte: options.createdFrom } : {}),
                ...(options.createdTo ? { lte: options.createdTo } : {}),
              },
            }
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
      },
    });
  }

  /** True when any variant of the product appears on an order line (blocks hard delete). */
  async hasOrderItems(productId: string): Promise<boolean> {
    const row = await prisma.orderItem.findFirst({
      where: { variant: { productId } },
      select: { id: true },
    });
    return Boolean(row);
  }
}

export const productRepository = new ProductRepository();
