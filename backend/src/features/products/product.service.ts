import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import { categoryService, slugifyName } from '@/features/categories/category.service';
import { productRepository } from './product.repository';
import type { CatalogProductBody, CatalogProductPatchBody } from './product.validation';
import type {
  CatalogProductDto,
  ProductRecord,
  PublicMediaRefDto,
  PublicProductCardDto,
  PublicProductDetailDto,
  PublicProductHighlightsDto,
  PublicRelatedProductDto,
  SiteCodeDto,
} from './product.types';

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
    isRecent: record.isRecent,
    isBestSeller: record.isBestSeller,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

function toMediaRef(
  url: string | null | undefined,
  publicId: string | null | undefined,
): PublicMediaRefDto | null {
  if (!url) return null;
  return { url: preferHttpsUrl(url), publicId: publicId ?? '' };
}

function decimalToNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  return Number(value.toString());
}

export function averageReviewStats(
  editorialRatings: number[],
  customerRatings: number[],
): { averageRating: number; reviewCount: number } {
  const ratings = [...editorialRatings, ...customerRatings];
  if (ratings.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    averageRating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  };
}

type CardSource = {
  id: string;
  slug: string;
  name: string;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  subcategory: { name: string } | null;
  galleryImages: Array<{ imageUrl: string }>;
  variants: Array<{
    id: string;
    price: { toString(): string } | number;
    inventory: { quantityOnHand: number } | null;
  }>;
  editorialReviews: Array<{ rating: number }>;
  reviews: Array<{ rating: number }>;
};

export function toPublicProductCardDto(
  row: CardSource,
  siteCode: SiteCodeDto,
): PublicProductCardDto {
  const firstVariant = row.variants[0];
  const primaryImage = row.galleryImages[0];
  const stats = averageReviewStats(
    row.editorialReviews.map((review) => review.rating),
    row.reviews.map((review) => review.rating),
  );

  return {
    id: row.id,
    siteCode,
    slug: row.slug,
    name: row.name,
    categoryName: row.subcategory?.name ?? null,
    price: decimalToNumber(firstVariant?.price) ?? 0,
    imageUrl: primaryImage ? preferHttpsUrl(primaryImage.imageUrl) : null,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    defaultVariantId: firstVariant?.id ?? null,
    quantity: firstVariant?.inventory?.quantityOnHand ?? 0,
    isFeatured: row.isFeatured,
    isRecent: row.isRecent,
    isBestSeller: row.isBestSeller,
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

  async listPublic(input: {
    siteId: string;
    siteCode: SiteCode;
    limit: number;
  }): Promise<PublicProductCardDto[]> {
    const rows = await this.repository.listActivePublicCards(input.siteId, {
      limit: input.limit,
    });
    return rows.map((row) => toPublicProductCardDto(row, input.siteCode));
  }

  async listPublicHighlights(input: {
    siteId: string;
    siteCode: SiteCode;
  }): Promise<PublicProductHighlightsDto> {
    const [recent, featured, bestSellers] = await Promise.all([
      this.repository.listActivePublicByFlag(input.siteId, 'isRecent', { limit: 4 }),
      this.repository.listActivePublicByFlag(input.siteId, 'isFeatured', { limit: 8 }),
      this.repository.listActivePublicByFlag(input.siteId, 'isBestSeller', {
        limit: 4,
      }),
    ]);

    return {
      recent: recent.map((row) => toPublicProductCardDto(row, input.siteCode)),
      featured: featured.map((row) => toPublicProductCardDto(row, input.siteCode)),
      bestSellers: bestSellers.map((row) =>
        toPublicProductCardDto(row, input.siteCode),
      ),
    };
  }

  async getPublicBySlug(input: {
    siteId: string;
    siteCode: SiteCode;
    slug: string;
  }): Promise<PublicProductDetailDto> {
    const record = await this.repository.findActivePublicBySlug(input.siteId, input.slug);
    if (!record) {
      throw new NotFoundError('Product not found');
    }

    const relatedRows = await this.repository.listRelatedActive(input.siteId, {
      excludeProductId: record.id,
      subcategoryId: record.subcategoryId,
      limit: 4,
    });

    const relatedProducts: PublicRelatedProductDto[] = relatedRows.map((row) => {
      const primaryImage = row.galleryImages[0];
      const firstVariant = row.variants[0];
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        price: decimalToNumber(firstVariant?.price) ?? 0,
        imageUrl: primaryImage ? preferHttpsUrl(primaryImage.imageUrl) : null,
      };
    });

    const stats = averageReviewStats(
      record.editorialReviews.map((review) => review.rating),
      record.reviews.map((review) => review.rating),
    );

    const dto: PublicProductDetailDto = {
      id: record.id,
      siteCode: input.siteCode,
      subcategoryId: record.subcategoryId,
      productCode: record.productCode,
      name: record.name,
      slug: record.slug,
      description: record.description ?? '',
      isFeatured: record.isFeatured,
      isRecent: record.isRecent,
      isBestSeller: record.isBestSeller,
      banner: toMediaRef(record.bannerUrl, record.bannerPublicId),
      sizeChart: toMediaRef(record.sizeChartUrl, record.sizeChartPublicId),
      gallery: record.galleryImages.map((row) => ({
        id: row.id,
        imageUrl: preferHttpsUrl(row.imageUrl),
        imagePublicId: row.imagePublicId,
        isPrimary: row.isPrimary,
        sortOrder: row.sortOrder,
      })),
      sizes: record.sizes.map((row) => ({
        id: row.id,
        label: row.label,
        sortOrder: row.sortOrder,
      })),
      colors: record.colors.map((row) => ({
        id: row.id,
        name: row.name,
        hex: row.hex,
        sortOrder: row.sortOrder,
      })),
      variants: record.variants.map((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        price: decimalToNumber(row.price) ?? 0,
        sizeLabel: row.sizeLabel,
        colorLabel: row.colorLabel,
        quantity: row.inventory?.quantityOnHand ?? 0,
        isActive: row.isActive,
        profileImage: toMediaRef(row.profileImageUrl, row.profileImagePublicId),
      })),
      videos: record.videos.map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        description: row.description,
        sortOrder: row.sortOrder,
      })),
      infoSections: record.infoSections.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        sortOrder: row.sortOrder,
      })),
      editorialReviews: record.editorialReviews.map((row) => ({
        id: row.id,
        createdByName: row.createdByName,
        rating: row.rating,
        title: row.title,
        body: row.body,
        imageUrl: row.imageUrl ? preferHttpsUrl(row.imageUrl) : null,
        sortOrder: row.sortOrder,
      })),
      tags: record.tags.map((row) => ({
        id: row.tag.id,
        name: row.tag.name,
      })),
      highlights: record.highlights.map((row) => ({
        id: row.id,
        text: row.text,
        sortOrder: row.sortOrder,
      })),
      tax: record.tax
        ? {
            cgst: decimalToNumber(record.tax.cgst) ?? 0,
            sgst: decimalToNumber(record.tax.sgst) ?? 0,
          }
        : null,
      coupon: record.coupon
        ? {
            couponId: record.coupon.couponId,
            code: record.coupon.coupon.code,
            type: record.coupon.coupon.type,
            value: decimalToNumber(record.coupon.coupon.value) ?? 0,
          }
        : null,
      relatedProducts,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    };

    logger.info(
      {
        event: 'public_product.viewed',
        siteCode: input.siteCode,
        productId: record.id,
        slug: record.slug,
      },
      'Public product detail served',
    );

    return dto;
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
      isFeatured: input.body.isFeatured ?? false,
      isRecent: input.body.isRecent ?? false,
      isBestSeller: input.body.isBestSeller ?? false,
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
      isFeatured: input.body.isFeatured ?? existing.isFeatured,
      isRecent: input.body.isRecent ?? existing.isRecent,
      isBestSeller: input.body.isBestSeller ?? existing.isBestSeller,
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
      ...(input.body.isFeatured !== undefined
        ? { isFeatured: input.body.isFeatured }
        : {}),
      ...(input.body.isRecent !== undefined ? { isRecent: input.body.isRecent } : {}),
      ...(input.body.isBestSeller !== undefined
        ? { isBestSeller: input.body.isBestSeller }
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
