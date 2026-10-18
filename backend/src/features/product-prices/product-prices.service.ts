import type { ProductStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import {
  productPricesRepository,
  type PriceProductRow,
  type PriceVariantUpdate,
} from './product-prices.repository';
import type {
  AdminProductPriceApplyResultDto,
  AdminProductPriceListItemDto,
  AdminProductPriceListResultDto,
  AdminProductPriceVariantDto,
} from './product-prices.types';
import type {
  AdminProductPriceApplyBody,
  AdminProductPriceListQuery,
} from './product-prices.validation';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

function decimalToNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Apply percent change and round to 2 decimal places.
 * percent > 0 increases; percent < 0 decreases. Clamps at 0.
 */
export function applyPercentToAmount(amount: number, percent: number): number {
  const next = Math.round(amount * (1 + percent / 100) * 100) / 100;
  return next < 0 ? 0 : next;
}

function isSimpleOffer(
  variants: Array<{ sizeLabel: string | null; colorLabel: string | null }>,
): boolean {
  if (variants.length === 0) return true;
  if (variants.length === 1) {
    const v = variants[0]!;
    return !v.sizeLabel && !v.colorLabel;
  }
  return false;
}

function resolveImageUrl(row: PriceProductRow): string | null {
  const gallery = row.galleryImages[0]?.imageUrl;
  if (gallery) return preferHttpsUrl(gallery);
  if (row.bannerUrl) return preferHttpsUrl(row.bannerUrl);
  const profile = row.variants.find((v) => v.profileImageUrl)?.profileImageUrl;
  if (profile) return preferHttpsUrl(profile);
  return null;
}

function resolveStatusFilter(
  status: AdminProductPriceListQuery['status'] | AdminProductPriceApplyBody['status'],
): ProductStatus | undefined {
  if (!status || status === 'all') return undefined;
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') return 'ACTIVE';
  if (normalized === 'DRAFT') return 'DRAFT';
  if (normalized === 'ARCHIVED') return 'ARCHIVED';
  return undefined;
}

function toVariantDto(
  variant: PriceProductRow['variants'][number],
  percent: number | undefined,
): AdminProductPriceVariantDto {
  const price = decimalToNumber(variant.price) ?? 0;
  const vendorPrice = decimalToNumber(variant.vendorPrice);
  const compareAtPrice = decimalToNumber(variant.compareAtPrice);

  return {
    id: variant.id,
    name: variant.name,
    sizeLabel: variant.sizeLabel,
    colorLabel: variant.colorLabel,
    isActive: variant.isActive,
    price,
    updatedPrice: percent == null ? null : applyPercentToAmount(price, percent),
    vendorPrice,
    updatedVendorPrice:
      percent == null || vendorPrice == null ? null : applyPercentToAmount(vendorPrice, percent),
    compareAtPrice,
    updatedCompareAtPrice:
      percent == null || compareAtPrice == null
        ? null
        : applyPercentToAmount(compareAtPrice, percent),
    currency: variant.currency,
  };
}

function toListItem(
  row: PriceProductRow,
  siteCode: SiteCode,
  percent: number | undefined,
): AdminProductPriceListItemDto {
  const simple = isSimpleOffer(row.variants);
  const firstVariant = row.variants[0];
  const variants = row.variants.map((v) => toVariantDto(v, percent));
  const price = decimalToNumber(firstVariant?.price ?? null);
  const vendorPrice = decimalToNumber(firstVariant?.vendorPrice ?? null);

  return {
    id: row.id,
    siteCode,
    productCode: row.productCode,
    name: row.name,
    status: row.status,
    imageUrl: resolveImageUrl(row),
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategory?.name ?? null,
    categoryId: row.subcategory?.parent?.id ?? row.subcategory?.parentId ?? null,
    categoryName: row.subcategory?.parent?.name ?? null,
    isSimpleOffer: simple,
    price,
    updatedPrice: percent == null || price == null ? null : applyPercentToAmount(price, percent),
    vendorPrice,
    updatedVendorPrice:
      percent == null || vendorPrice == null ? null : applyPercentToAmount(vendorPrice, percent),
    currency: firstVariant?.currency ?? 'INR',
    variants,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildVariantUpdates(rows: PriceProductRow[], percent: number): PriceVariantUpdate[] {
  const updates: PriceVariantUpdate[] = [];
  for (const row of rows) {
    for (const variant of row.variants) {
      const price = decimalToNumber(variant.price) ?? 0;
      const vendorPrice = decimalToNumber(variant.vendorPrice);
      const compareAtPrice = decimalToNumber(variant.compareAtPrice);
      updates.push({
        id: variant.id,
        price: applyPercentToAmount(price, percent),
        vendorPrice: vendorPrice == null ? null : applyPercentToAmount(vendorPrice, percent),
        compareAtPrice:
          compareAtPrice == null ? null : applyPercentToAmount(compareAtPrice, percent),
      });
    }
  }
  return updates;
}

/**
 * Product-prices service — preview and apply percent updates site-scoped.
 *
 * Fields updated per variant:
 * - `price` (selling / list) — always
 * - `vendorPrice` — when set
 * - `compareAtPrice` (MRP / compare-at) — when set
 */
export class ProductPricesService {
  constructor(private readonly repository = productPricesRepository) {}

  async listForAdmin(input: {
    siteId: string;
    siteCode: SiteCode;
    query: AdminProductPriceListQuery;
  }): Promise<AdminProductPriceListResultDto> {
    const limit = input.query.limit ?? 10;
    const page = input.query.page ?? 1;
    const skip = input.query.offset != null ? input.query.offset : (page - 1) * limit;
    const status = resolveStatusFilter(input.query.status);

    if (input.query.categoryId) {
      await this.assertCategoryScope(
        input.siteId,
        input.query.categoryId,
        input.query.subcategoryId,
      );
    }

    if (input.query.productId) {
      const product = await this.repository.findProductForSite(input.siteId, input.query.productId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }
    }

    const filters = {
      status,
      q: input.query.q,
      categoryId: input.query.categoryId,
      subcategoryId: input.query.subcategoryId,
      productId: input.query.productId,
    };

    const [rows, total] = await Promise.all([
      this.repository.listForPrices(input.siteId, {
        ...filters,
        skip,
        take: limit,
      }),
      this.repository.countForPrices(input.siteId, filters),
    ]);

    return {
      items: rows.map((row) => toListItem(row, input.siteCode, input.query.percent)),
      meta: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async applyPercent(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    body: AdminProductPriceApplyBody;
  }): Promise<AdminProductPriceApplyResultDto> {
    const percent = input.body.percent;
    if (percent === 0) {
      throw new ValidationError('percent must be non-zero');
    }

    const status = resolveStatusFilter(input.body.status);

    if (input.body.productId) {
      const product = await this.repository.findProductForSite(input.siteId, input.body.productId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }
    } else if (input.body.categoryId) {
      await this.assertCategoryScope(input.siteId, input.body.categoryId, input.body.subcategoryId);
    } else {
      throw new ValidationError('Provide exactly one of productId or categoryId');
    }

    const filters = {
      status,
      q: input.body.q,
      categoryId: input.body.categoryId,
      subcategoryId: input.body.subcategoryId,
      productId: input.body.productId,
    };

    const rows = await this.repository.listAllMatching(input.siteId, filters);
    const updates = buildVariantUpdates(rows, percent);
    await this.repository.applyVariantPriceUpdates(updates);

    const refreshed = await this.repository.listAllMatching(input.siteId, filters);

    logger.info(
      {
        event: 'product_prices.percent_applied',
        siteCode: input.siteCode,
        userId: input.userId,
        percent,
        productId: input.body.productId ?? null,
        categoryId: input.body.categoryId ?? null,
        subcategoryId: input.body.subcategoryId ?? null,
        productsUpdated: refreshed.length,
        variantsUpdated: updates.length,
      },
      'Admin product prices updated by percent',
    );

    return {
      percent,
      productsUpdated: refreshed.length,
      variantsUpdated: updates.length,
      items: refreshed.map((row) => toListItem(row, input.siteCode, undefined)),
    };
  }

  private async assertCategoryScope(
    siteId: string,
    categoryId: string,
    subcategoryId?: string,
  ): Promise<void> {
    const root = await this.repository.findRootCategoryForSite(siteId, categoryId);
    if (!root) {
      throw new NotFoundError('Category not found');
    }
    if (subcategoryId) {
      const sub = await this.repository.findSubcategoryUnderParent(
        siteId,
        categoryId,
        subcategoryId,
      );
      if (!sub) {
        throw new NotFoundError('Subcategory not found under category');
      }
    }
  }
}

export const productPricesService = new ProductPricesService();
