import type { ProductStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { SiteCode } from '@/types/common';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { inventoryRepository, type StockProductRow } from './inventory.repository';
import type {
  AdminStockListItemDto,
  AdminStockListResultDto,
  AdminStockVariantDto,
  AdminStockVariantUpdateResultDto,
} from './inventory.types';
import type { AdminStockListQuery } from './inventory.validation';

function preferHttpsUrl(url: string): string {
  if (url.startsWith('http://res.cloudinary.com/')) {
    return `https://${url.slice('http://'.length)}`;
  }
  return url;
}

function decimalToNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
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

function resolveImageUrl(row: StockProductRow): string | null {
  const gallery = row.galleryImages[0]?.imageUrl;
  if (gallery) return preferHttpsUrl(gallery);
  if (row.bannerUrl) return preferHttpsUrl(row.bannerUrl);
  const profile = row.variants.find((v) => v.profileImageUrl)?.profileImageUrl;
  if (profile) return preferHttpsUrl(profile);
  return null;
}

function resolveStatusFilter(
  status: AdminStockListQuery['status'],
): ProductStatus | undefined {
  if (!status || status === 'all') return undefined;
  const normalized = status.toUpperCase();
  if (normalized === 'ACTIVE') return 'ACTIVE';
  if (normalized === 'DRAFT') return 'DRAFT';
  if (normalized === 'ARCHIVED') return 'ARCHIVED';
  return undefined;
}

function toVariantDto(
  variant: StockProductRow['variants'][number],
): AdminStockVariantDto {
  return {
    id: variant.id,
    name: variant.name,
    sizeLabel: variant.sizeLabel,
    colorLabel: variant.colorLabel,
    quantity: variant.inventory?.quantityOnHand ?? 0,
    isActive: variant.isActive,
  };
}

function toStockListItem(
  row: StockProductRow,
  siteCode: SiteCode,
): AdminStockListItemDto {
  const simple = isSimpleOffer(row.variants);
  const firstVariant = row.variants[0];
  const variants = row.variants.map(toVariantDto);
  const quantity = simple
    ? (firstVariant?.inventory?.quantityOnHand ?? 0)
    : variants.reduce((sum, v) => sum + v.quantity, 0);

  return {
    id: row.id,
    siteCode,
    productCode: row.productCode,
    name: row.name,
    status: row.status,
    imageUrl: resolveImageUrl(row),
    price: decimalToNumber(firstVariant?.price ?? null),
    vendorPrice: decimalToNumber(firstVariant?.vendorPrice ?? null),
    currency: firstVariant?.currency ?? 'INR',
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategory?.name ?? null,
    categoryId: row.subcategory?.parent?.id ?? row.subcategory?.parentId ?? null,
    categoryName: row.subcategory?.parent?.name ?? null,
    isSimpleOffer: simple,
    quantity,
    variants,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Inventory service — admin stock list and absolute qty updates.
 */
export class InventoryService {
  constructor(private readonly repository = inventoryRepository) {}

  async listForAdmin(input: {
    siteId: string;
    siteCode: SiteCode;
    query: AdminStockListQuery;
  }): Promise<AdminStockListResultDto> {
    const limit = input.query.limit ?? 10;
    const page = input.query.page ?? 1;
    const skip =
      input.query.offset != null ? input.query.offset : (page - 1) * limit;
    const status = resolveStatusFilter(input.query.status);

    const filters = {
      status,
      q: input.query.q,
      categoryId: input.query.categoryId,
      subcategoryId: input.query.subcategoryId,
    };

    const [rows, total] = await Promise.all([
      this.repository.listForStock(input.siteId, {
        ...filters,
        skip,
        take: limit,
      }),
      this.repository.countForStock(input.siteId, filters),
    ]);

    return {
      items: rows.map((row) => toStockListItem(row, input.siteCode)),
      meta: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async updateVariantQuantity(input: {
    siteId: string;
    siteCode: SiteCode;
    userId: string;
    variantId: string;
    quantity: number;
  }): Promise<AdminStockVariantUpdateResultDto> {
    if (!Number.isInteger(input.quantity) || input.quantity < 0) {
      throw new ValidationError('Quantity must be a non-negative integer');
    }

    const variant = await this.repository.findVariantForSite(
      input.siteId,
      input.variantId,
    );
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    const previous = variant.inventory?.quantityOnHand ?? 0;
    const result = await this.repository.setVariantQuantityOnHand({
      variantId: variant.id,
      inventoryItemId: variant.inventory?.id ?? null,
      previousQuantity: previous,
      nextQuantity: input.quantity,
      note: `Admin stock set to ${input.quantity}`,
    });

    logger.info(
      {
        event: 'inventory.stock_adjusted',
        siteCode: input.siteCode,
        userId: input.userId,
        productId: variant.productId,
        variantId: variant.id,
        previousQuantity: previous,
        nextQuantity: result.quantityOnHand,
      },
      'Admin stock quantity updated',
    );

    return {
      productId: variant.productId,
      variantId: variant.id,
      quantity: result.quantityOnHand,
    };
  }
}

export const inventoryService = new InventoryService();
