import { authRepository } from '@/features/auth/auth.repository';
import { applyProductCouponRupees } from '@/features/checkout/checkout.pricing';
import { logger } from '@/lib/logger';
import { decimalToNumber } from '@/lib/money';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import { cartRepository } from './cart.repository';
import type {
  CartDto,
  CartItemDto,
  CartSyncResultDto,
  CartSyncSkippedItem,
} from './cart.types';
import type {
  AddCartItemInput,
  SyncCartInput,
  UpdateCartItemInput,
} from './cart.validation';

type CartWithItems = Awaited<ReturnType<typeof cartRepository.findOrCreateCart>>;
type CartItemRow = CartWithItems['items'][number];

const ECOMMERCE_SITE_CODE = 'IN';

function availableStock(
  inventory: { quantityOnHand: number; quantityReserved: number } | null | undefined,
): number {
  if (!inventory) return 0;
  return Math.max(0, inventory.quantityOnHand - inventory.quantityReserved);
}

/**
 * Cart service — authenticated customer account cart for the .in storefront.
 */
export class CartService {
  constructor(
    private readonly repository = cartRepository,
    private readonly users = authRepository,
  ) {}

  async getCart(userId: string): Promise<CartDto> {
    await this.requireActiveCustomer(userId);
    const cart = await this.repository.findOrCreateCart(userId);
    return this.toCartDto(cart);
  }

  async addItem(userId: string, input: AddCartItemInput): Promise<CartItemDto> {
    await this.requireActiveCustomer(userId);
    const cart = await this.repository.findOrCreateCart(userId);

    const product = await this.repository.findActiveInProduct(
      input.productId,
      ECOMMERCE_SITE_CODE,
    );
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const variant = await this.repository.findVariantForProduct(
      input.productId,
      input.variantId,
    );
    if (!variant) {
      throw new ValidationError('Variant does not belong to this product');
    }

    const stock = availableStock(variant.inventory);
    if (stock <= 0) {
      throw new ValidationError('This option is out of stock');
    }

    const existing = await this.repository.findItemByVariant(cart.id, input.variantId);
    const nextQty = Math.min(
      stock,
      (existing?.quantity ?? 0) + input.quantity,
    );
    if (nextQty <= 0) {
      throw new ValidationError('This option is out of stock');
    }

    const item = await this.repository.upsertItem(
      cart.id,
      input.productId,
      input.variantId,
      nextQty,
    );

    logger.info(
      {
        event: 'cart.item_added',
        userId,
        productId: input.productId,
        variantId: input.variantId,
        quantity: nextQty,
      },
      'Cart item added',
    );

    return this.toItemDto(item);
  }

  async updateItem(
    userId: string,
    itemId: string,
    input: UpdateCartItemInput,
  ): Promise<CartItemDto> {
    await this.requireActiveCustomer(userId);
    const existing = await this.repository.findItemForUser(userId, itemId);
    if (!existing) {
      throw new NotFoundError('Cart item not found');
    }

    if (
      existing.product.status !== 'ACTIVE' ||
      !existing.product.site.isActive ||
      existing.product.site.code !== ECOMMERCE_SITE_CODE ||
      !existing.variant.isActive
    ) {
      throw new ValidationError('Product is no longer available');
    }

    const stock = availableStock(existing.variant.inventory);
    const nextQty = Math.min(stock, input.quantity);
    if (nextQty <= 0) {
      await this.repository.deleteItem(existing.id);
      throw new ValidationError('This option is out of stock');
    }

    const item = await this.repository.updateItemQuantity(existing.id, nextQty);
    logger.info(
      {
        event: 'cart.item_updated',
        userId,
        itemId,
        quantity: nextQty,
      },
      'Cart item quantity updated',
    );
    return this.toItemDto(item);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.requireActiveCustomer(userId);
    const item = await this.repository.findItemForUser(userId, itemId);
    if (!item) {
      throw new NotFoundError('Cart item not found');
    }
    await this.repository.deleteItem(item.id);
    logger.info(
      {
        event: 'cart.item_removed',
        userId,
        itemId,
      },
      'Cart item removed',
    );
  }

  async clearCart(userId: string): Promise<CartDto> {
    await this.requireActiveCustomer(userId);
    const cart = await this.repository.findOrCreateCart(userId);
    await this.repository.clearItems(cart.id);
    const refreshed = await this.repository.findOrCreateCart(userId);
    logger.info({ event: 'cart.cleared', userId }, 'Cart cleared');
    return this.toCartDto(refreshed);
  }

  /**
   * Merge guest cart lines into the account cart.
   * Same (productId, variantId): sum quantities, then cap at available stock.
   */
  async syncCart(userId: string, input: SyncCartInput): Promise<CartSyncResultDto> {
    await this.requireActiveCustomer(userId);
    const cart = await this.repository.findOrCreateCart(userId);

    const deduped = new Map<
      string,
      { productId: string; variantId: string; quantity: number }
    >();
    for (const raw of input.items) {
      const key = `${raw.productId}:${raw.variantId}`;
      const prev = deduped.get(key);
      if (prev) {
        prev.quantity = Math.min(99, prev.quantity + raw.quantity);
      } else {
        deduped.set(key, {
          productId: raw.productId,
          variantId: raw.variantId,
          quantity: raw.quantity,
        });
      }
    }

    const skipped: CartSyncSkippedItem[] = [];
    let merged = 0;

    for (const entry of deduped.values()) {
      const product = await this.repository.findProductEligibility(entry.productId);
      if (!product) {
        skipped.push({
          productId: entry.productId,
          variantId: entry.variantId,
          reason: 'INVALID_PRODUCT',
        });
        continue;
      }

      if (
        product.status !== 'ACTIVE' ||
        !product.site.isActive ||
        product.site.code !== ECOMMERCE_SITE_CODE
      ) {
        skipped.push({
          productId: entry.productId,
          variantId: entry.variantId,
          reason: 'INACTIVE_OR_WRONG_SITE',
        });
        continue;
      }

      const variant = await this.repository.findVariantForProduct(
        entry.productId,
        entry.variantId,
      );
      if (!variant) {
        skipped.push({
          productId: entry.productId,
          variantId: entry.variantId,
          reason: 'INVALID_VARIANT',
        });
        continue;
      }

      const stock = availableStock(variant.inventory);
      if (stock <= 0) {
        skipped.push({
          productId: entry.productId,
          variantId: entry.variantId,
          reason: 'OUT_OF_STOCK',
        });
        continue;
      }

      const existing = await this.repository.findItemByVariant(cart.id, entry.variantId);
      const nextQty = Math.min(
        stock,
        (existing?.quantity ?? 0) + entry.quantity,
      );
      if (nextQty <= 0) {
        skipped.push({
          productId: entry.productId,
          variantId: entry.variantId,
          reason: 'OUT_OF_STOCK',
        });
        continue;
      }

      await this.repository.upsertItem(
        cart.id,
        entry.productId,
        entry.variantId,
        nextQty,
      );
      merged += 1;
    }

    const refreshed = await this.repository.findOrCreateCart(userId);
    logger.info(
      {
        event: 'cart.sync',
        userId,
        merged,
        skipped: skipped.length,
      },
      'Cart synced from guest bag',
    );

    return {
      cart: this.toCartDto(refreshed),
      skipped,
    };
  }

  private async requireActiveCustomer(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenError('Insufficient permissions');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }
    return user;
  }

  private toCartDto(cart: CartWithItems): CartDto {
    return {
      id: cart.id,
      items: cart.items
        .filter((item) => this.isEligibleStorefrontItem(item))
        .map((item) => this.toItemDto(item)),
    };
  }

  private isEligibleStorefrontItem(item: CartItemRow): boolean {
    return (
      item.product.status === 'ACTIVE' &&
      item.product.site.isActive &&
      item.product.site.code === ECOMMERCE_SITE_CODE &&
      item.variant.isActive
    );
  }

  private toItemDto(item: CartItemRow): CartItemDto {
    const listPrice = decimalToNumber(item.variant.price) ?? 0;
    const couponRow = item.product.coupon?.coupon ?? null;
    const couponActive = Boolean(couponRow?.isActive);
    const priced = applyProductCouponRupees(
      listPrice,
      couponRow && couponActive
        ? {
            type: couponRow.type,
            value: decimalToNumber(couponRow.value) ?? 0,
            isActive: couponRow.isActive,
            startsAt: couponRow.startsAt,
            endsAt: couponRow.endsAt,
          }
        : null,
    );
    const stock = availableStock(item.variant.inventory);
    const coupon =
      item.product.coupon && couponActive && priced.discountAmount > 0
        ? {
            couponId: item.product.coupon.couponId,
            code: item.product.coupon.coupon.code,
            type: item.product.coupon.coupon.type,
            value: decimalToNumber(item.product.coupon.coupon.value) ?? 0,
          }
        : null;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      productSlug: item.product.slug,
      productCode: item.product.productCode ?? '',
      categoryName: item.product.subcategory?.name ?? null,
      variantName: item.variant.name,
      imageUrl:
        item.product.galleryImages[0]?.imageUrl ??
        item.product.media[0]?.media.url ??
        null,
      quantity: item.quantity,
      listPrice: listPrice.toFixed(2),
      unitPrice: priced.unitPrice.toFixed(2),
      discountAmount: priced.discountAmount.toFixed(2),
      discountCode: coupon?.code ?? null,
      currency: item.variant.currency ?? 'INR',
      availableQuantity: stock,
      available: stock > 0,
      cgstPercent: item.product.tax
        ? decimalToNumber(item.product.tax.cgst) ?? 0
        : 0,
      sgstPercent: item.product.tax
        ? decimalToNumber(item.product.tax.sgst) ?? 0
        : 0,
      coupon,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

export const cartService = new CartService();
