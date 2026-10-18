import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { ConflictError, NotFoundError } from '@/utils/AppError';
import { categoryService, slugifyName } from '@/features/categories/category.service';
import { productRepository } from './product.repository';
import type {
  AdminProductListQuery,
  CatalogProductBody,
  CatalogProductPatchBody,
  PublicProductAvailability,
  PublicProductSort,
} from './product.validation';
import type {
  AdminProductListItemDto,
  AdminProductListResultDto,
  CatalogProductDto,
  ProductRecord,
  PublicMediaRefDto,
  PublicProductCardDto,
  PublicProductDetailDto,
  PublicProductFacetsDto,
  PublicProductHighlightsDto,
  PublicProductListResultDto,
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
  description?: string | null;
  isFeatured: boolean;
  isRecent: boolean;
  isBestSeller: boolean;
  subcategory: { name: string } | null;
  galleryImages: Array<{ imageUrl: string }>;
  variants: Array<{
    id: string;
    price: { toString(): string } | number;
    compareAtPrice?: { toString(): string } | number | null;
    inventory: { quantityOnHand: number } | null;
  }>;
  editorialReviews: Array<{ rating: number }>;
  reviews: Array<{ rating: number }>;
  coupon?: {
    couponId: string;
    coupon: {
      code: string;
      type: string;
      value: { toString(): string } | number;
      isActive?: boolean;
    };
  } | null;
  tax?: {
    cgst: { toString(): string } | number;
    sgst: { toString(): string } | number;
  } | null;
};

function toPublicCardCouponDto(
  coupon: CardSource['coupon'],
): PublicProductCardDto['coupon'] {
  if (!coupon) return null;
  if (coupon.coupon.isActive === false) return null;
  return {
    couponId: coupon.couponId,
    code: coupon.coupon.code,
    type: coupon.coupon.type,
    value: decimalToNumber(coupon.coupon.value) ?? 0,
  };
}

export function toPublicProductCardDto(
  row: CardSource,
  siteCode: SiteCodeDto,
  options: { includeVendorPrice?: boolean } = {},
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
    description: row.description?.trim() ? row.description : null,
    price: decimalToNumber(firstVariant?.price) ?? 0,
    compareAtPrice: decimalToNumber(firstVariant?.compareAtPrice ?? null),
    ...(options.includeVendorPrice
      ? { vendorPrice: decimalToNumber(firstVariant?.vendorPrice ?? null) }
      : {}),
    imageUrl: primaryImage ? preferHttpsUrl(primaryImage.imageUrl) : null,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    defaultVariantId: firstVariant?.id ?? null,
    quantity: firstVariant?.inventory?.quantityOnHand ?? 0,
    isFeatured: row.isFeatured,
    isRecent: row.isRecent,
    isBestSeller: row.isBestSeller,
    coupon: toPublicCardCouponDto(row.coupon),
    tax: row.tax
      ? {
          cgst: decimalToNumber(row.tax.cgst) ?? 0,
          sgst: decimalToNumber(row.tax.sgst) ?? 0,
        }
      : null,
  };
}

function matchesAvailability(
  card: PublicProductCardDto,
  availability: PublicProductAvailability | undefined,
): boolean {
  if (!availability) return true;
  if (availability === 'in_stock') {
    return Boolean(card.defaultVariantId) && card.quantity > 0;
  }
  return !card.defaultVariantId || card.quantity <= 0;
}

function matchesPriceRange(
  card: PublicProductCardDto,
  priceMin: number | undefined,
  priceMax: number | undefined,
): boolean {
  if (priceMin != null && card.price < priceMin) return false;
  if (priceMax != null && card.price > priceMax) return false;
  return true;
}

function sortPublicCards(
  cards: PublicProductCardDto[],
  sort: PublicProductSort,
): PublicProductCardDto[] {
  const next = [...cards];
  switch (sort) {
    case 'rating':
      return next.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.reviewCount - a.reviewCount;
      });
    case 'price_asc':
      return next.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return next.sort((a, b) => b.price - a.price);
    case 'default':
    default:
      return next;
  }
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
    page?: number;
    offset?: number;
    q?: string;
    categorySlug?: string;
    priceMin?: number;
    priceMax?: number;
    availability?: PublicProductAvailability;
    sort?: PublicProductSort;
    includeVendorPrice?: boolean;
  }): Promise<PublicProductListResultDto> {
    const cardOpts = { includeVendorPrice: Boolean(input.includeVendorPrice) };
    const page = input.page ?? 1;
    const limit = input.limit;
    const sort = input.sort ?? 'default';
    const offset =
      input.offset != null ? input.offset : Math.max(0, (page - 1) * limit);
    const hasCatalogFilters =
      Boolean(input.q?.trim()) ||
      Boolean(input.categorySlug) ||
      input.priceMin != null ||
      input.priceMax != null ||
      Boolean(input.availability) ||
      sort !== 'default' ||
      page > 1 ||
      input.offset != null ||
      limit !== 15;

    if (!hasCatalogFilters) {
      const rows = await this.repository.listActivePublicCards(input.siteId, {
        limit,
      });
      const items = rows.map((row) =>
        toPublicProductCardDto(row, input.siteCode, cardOpts),
      );
      return {
        items,
        meta: {
          page: 1,
          limit,
          total: items.length,
          totalPages: items.length > 0 ? 1 : 0,
        },
      };
    }

    const rows = await this.repository.listActiveCatalogCandidates(input.siteId, {
      categorySlug: input.categorySlug,
      q: input.q,
    });

    let cards = rows.map((row) =>
      toPublicProductCardDto(row, input.siteCode, cardOpts),
    );
    cards = cards.filter(
      (card) =>
        matchesPriceRange(card, input.priceMin, input.priceMax) &&
        matchesAvailability(card, input.availability),
    );
    cards = sortPublicCards(cards, sort);

    const total = cards.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const items = cards.slice(offset, offset + limit);
    const resolvedPage = Math.floor(offset / limit) + 1;

    return {
      items,
      meta: { page: resolvedPage, limit, total, totalPages },
    };
  }

  async getPublicFacets(input: {
    siteId: string;
    siteCode: SiteCode;
  }): Promise<PublicProductFacetsDto> {
    const { roots, priceRows } = await this.repository.listPublicFacets(input.siteId);

    const firstPriceByProduct = new Map<string, number>();
    for (const row of priceRows) {
      if (firstPriceByProduct.has(row.productId)) continue;
      const price = decimalToNumber(row.price);
      if (price == null) continue;
      firstPriceByProduct.set(row.productId, price);
    }

    const prices = [...firstPriceByProduct.values()];
    const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
    const priceMax = prices.length > 0 ? Math.max(...prices) : 0;

    const categories = roots.map((root) => {
      let productCount = 0;
      let imageUrl: string | null = null;
      for (const child of root.children) {
        productCount += child.catalogProducts.length;
        if (!imageUrl) {
          const firstImage = child.catalogProducts.find(
            (product) => product.galleryImages[0]?.imageUrl,
          )?.galleryImages[0]?.imageUrl;
          if (firstImage) {
            imageUrl = preferHttpsUrl(firstImage);
          }
        }
      }
      return {
        id: root.id,
        name: root.name,
        slug: root.slug,
        productCount,
        imageUrl,
      };
    });

    return {
      categories,
      price: { min: priceMin, max: priceMax },
    };
  }

  async listPublicHighlights(input: {
    siteId: string;
    siteCode: SiteCode;
    includeVendorPrice?: boolean;
  }): Promise<PublicProductHighlightsDto> {
    const cardOpts = { includeVendorPrice: Boolean(input.includeVendorPrice) };
    const [recent, featured, bestSellers] = await Promise.all([
      this.repository.listActivePublicByFlag(input.siteId, 'isRecent', { limit: 4 }),
      this.repository.listActivePublicByFlag(input.siteId, 'isFeatured', { limit: 8 }),
      this.repository.listActivePublicByFlag(input.siteId, 'isBestSeller', {
        limit: 4,
      }),
    ]);

    return {
      recent: recent.map((row) =>
        toPublicProductCardDto(row, input.siteCode, cardOpts),
      ),
      featured: featured.map((row) =>
        toPublicProductCardDto(row, input.siteCode, cardOpts),
      ),
      bestSellers: bestSellers.map((row) =>
        toPublicProductCardDto(row, input.siteCode, cardOpts),
      ),
    };
  }

  async getPublicBySlug(input: {
    siteId: string;
    siteCode: SiteCode;
    slug: string;
    includeVendorPrice?: boolean;
  }): Promise<PublicProductDetailDto> {
    const includeVendorPrice = Boolean(input.includeVendorPrice);
    const record = await this.repository.findActivePublicBySlug(input.siteId, input.slug);
    if (!record) {
      throw new NotFoundError('Product not found');
    }

    // All ACTIVE products in the same subcategory; current product is excluded.
    const relatedRows = await this.repository.listRelatedActive(input.siteId, {
      excludeProductId: record.id,
      subcategoryId: record.subcategoryId,
    });

    const relatedProducts: PublicRelatedProductDto[] = relatedRows.map((row) => {
      const primaryImage = row.galleryImages[0];
      const firstVariant = row.variants[0];
      const relatedStats = averageReviewStats(
        row.editorialReviews.map((review) => review.rating),
        row.reviews.map((review) => review.rating),
      );
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        categoryName: row.subcategory?.name ?? null,
        price: decimalToNumber(firstVariant?.price) ?? 0,
        ...(includeVendorPrice
          ? { vendorPrice: decimalToNumber(firstVariant?.vendorPrice ?? null) }
          : {}),
        imageUrl: primaryImage ? preferHttpsUrl(primaryImage.imageUrl) : null,
        averageRating: relatedStats.averageRating,
        reviewCount: relatedStats.reviewCount,
        defaultVariantId: firstVariant?.id ?? null,
        quantity: firstVariant?.inventory?.quantityOnHand ?? 0,
        coupon: toPublicCardCouponDto(row.coupon),
        tax: row.tax
          ? {
              cgst: decimalToNumber(row.tax.cgst) ?? 0,
              sgst: decimalToNumber(row.tax.sgst) ?? 0,
            }
          : null,
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
        ...(includeVendorPrice
          ? { vendorPrice: decimalToNumber(row.vendorPrice ?? null) }
          : {}),
        sizeLabel: row.sizeLabel,
        colorLabel: row.colorLabel,
        weightGrams: row.weightGrams ?? null,
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

    if (await this.repository.hasOrderItems(input.productId)) {
      throw new ConflictError(
        'Cannot delete a product that appears on existing orders',
      );
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

  /**
   * Site-scoped admin list for View All Products (filters + offset pagination).
   */
  async listForAdmin(input: {
    siteId: string;
    siteCode: SiteCode;
    query: AdminProductListQuery;
  }): Promise<AdminProductListResultDto> {
    const limit = input.query.limit ?? 10;
    const page = input.query.page ?? 1;
    const skip =
      input.query.offset != null ? input.query.offset : (page - 1) * limit;

    const statusFilter =
      input.query.status === 'active'
        ? ('ACTIVE' as const)
        : input.query.status === 'draft'
          ? ('DRAFT' as const)
          : undefined;

    const createdRange = resolveAdminCreatedRange(input.query);

    const [rows, total] = await Promise.all([
      this.repository.listForAdminSite(input.siteId, {
        status: statusFilter,
        q: input.query.q,
        createdFrom: createdRange?.from,
        createdTo: createdRange?.to,
        skip,
        take: limit,
      }),
      this.repository.countForAdminSite(input.siteId, {
        status: statusFilter,
        q: input.query.q,
        createdFrom: createdRange?.from,
        createdTo: createdRange?.to,
      }),
    ]);

    const items: AdminProductListItemDto[] = rows.map((row) => {
      const firstVariant = row.variants[0];
      const imageUrl = row.galleryImages[0]?.imageUrl
        ? preferHttpsUrl(row.galleryImages[0].imageUrl)
        : null;
      return {
        id: row.id,
        siteCode: input.siteCode,
        subcategoryId: row.subcategoryId,
        subcategoryName: row.subcategory?.name ?? null,
        productCode: row.productCode,
        name: row.name,
        slug: row.slug,
        active: row.status === 'ACTIVE',
        isFeatured: row.isFeatured,
        isRecent: row.isRecent,
        isBestSeller: row.isBestSeller,
        imageUrl,
        price: decimalToNumber(firstVariant?.price ?? null),
        vendorPrice: decimalToNumber(firstVariant?.vendorPrice ?? null),
        quantity: firstVariant?.inventory?.quantityOnHand ?? 0,
        currency: firstVariant?.currency ?? 'INR',
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    return {
      items,
      meta: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async deleteForSite(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    productId: string;
  }): Promise<void> {
    const existing = await this.repository.findByIdForSite(input.siteId, input.productId);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    if (await this.repository.hasOrderItems(input.productId)) {
      throw new ConflictError(
        'Cannot delete a product that appears on existing orders',
      );
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

/** Inclusive calendar-day createdAt window for admin list period filters. */
function resolveAdminCreatedRange(
  query: AdminProductListQuery,
): { from: Date; to: Date } | null {
  const period = query.period ?? 'today';
  if (period === 'all') {
    return null;
  }

  const dateStr =
    period === 'day' && query.date
      ? query.date
      : new Date().toISOString().slice(0, 10);

  const from = new Date(`${dateStr}T00:00:00.000`);
  const to = new Date(`${dateStr}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }
  return { from, to };
}

export const productService = new ProductService();
