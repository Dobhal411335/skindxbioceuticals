import type { ProductStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const stockProductInclude = {
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
      vendorPrice: true,
      currency: true,
      sizeLabel: true,
      colorLabel: true,
      isActive: true,
      profileImageUrl: true,
      inventory: {
        select: {
          id: true,
          quantityOnHand: true,
          quantityReserved: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type StockProductRow = Prisma.ProductGetPayload<{
  include: typeof stockProductInclude;
}>;

export type StockVariantWithProduct = {
  id: string;
  productId: string;
  product: { id: string; siteId: string; name: string };
  inventory: {
    id: string;
    quantityOnHand: number;
    quantityReserved: number;
  } | null;
};

/**
 * Inventory repository — Prisma data access for admin stock management.
 */
export class InventoryRepository {
  protected readonly db = prisma;

  private buildWhere(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
    },
  ): Prisma.ProductWhereInput {
    const q = options.q?.trim();
    return {
      siteId,
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

  async listForStock(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
      skip: number;
      take: number;
    },
  ): Promise<StockProductRow[]> {
    return this.db.product.findMany({
      where: this.buildWhere(siteId, options),
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: options.skip,
      take: options.take,
      include: stockProductInclude,
    });
  }

  async countForStock(
    siteId: string,
    options: {
      status?: ProductStatus;
      q?: string;
      categoryId?: string;
      subcategoryId?: string;
    },
  ): Promise<number> {
    return this.db.product.count({
      where: this.buildWhere(siteId, options),
    });
  }

  async findVariantForSite(
    siteId: string,
    variantId: string,
  ): Promise<StockVariantWithProduct | null> {
    const row = await this.db.productVariant.findFirst({
      where: {
        id: variantId,
        product: { siteId },
      },
      select: {
        id: true,
        productId: true,
        product: { select: { id: true, siteId: true, name: true } },
        inventory: {
          select: { id: true, quantityOnHand: true, quantityReserved: true },
        },
      },
    });
    return row;
  }

  /**
   * Sets absolute quantityOnHand and writes an ADJUSTMENT movement.
   * Creates InventoryItem when missing. Never trusts client siteId —
   * caller must resolve the variant via findVariantForSite first.
   */
  async setVariantQuantityOnHand(input: {
    variantId: string;
    inventoryItemId: string | null;
    previousQuantity: number;
    nextQuantity: number;
    note: string;
  }): Promise<{ quantityOnHand: number }> {
    const delta = input.nextQuantity - input.previousQuantity;

    return this.db.$transaction(async (tx) => {
      let inventoryItemId = input.inventoryItemId;

      if (!inventoryItemId) {
        const created = await tx.inventoryItem.create({
          data: {
            variantId: input.variantId,
            quantityOnHand: input.nextQuantity,
            quantityReserved: 0,
          },
        });
        inventoryItemId = created.id;
      } else {
        await tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { quantityOnHand: input.nextQuantity },
        });
      }

      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId,
            type: 'ADJUSTMENT',
            quantity: Math.abs(delta),
            note: input.note,
            referenceType: 'admin_stock',
            referenceId: input.variantId,
          },
        });
      }

      return { quantityOnHand: input.nextQuantity };
    });
  }
}

export const inventoryRepository = new InventoryRepository();
