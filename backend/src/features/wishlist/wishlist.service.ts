import { authRepository } from '@/features/auth/auth.repository';
import { logger } from '@/lib/logger';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import { wishlistRepository } from './wishlist.repository';
import type {
  WishlistDto,
  WishlistItemDto,
  WishlistSyncResultDto,
  WishlistSyncSkippedItem,
} from './wishlist.types';
import type { AddWishlistItemInput, SyncWishlistInput } from './wishlist.validation';

type WishlistWithItems = Awaited<ReturnType<typeof wishlistRepository.findOrCreateWishlist>>;
type WishlistItemRow = WishlistWithItems['items'][number];

const ECOMMERCE_SITE_CODE = 'IN';

/**
 * Wishlist service — customer wishlist scoped to the authenticated user.
 */
export class WishlistService {
  constructor(
    private readonly repository = wishlistRepository,
    private readonly users = authRepository,
  ) {}

  async getWishlist(userId: string): Promise<WishlistDto> {
    await this.requireActiveCustomer(userId);
    const wishlist = await this.repository.findOrCreateWishlist(userId);
    return this.toWishlistDto(wishlist);
  }

  async addItem(userId: string, input: AddWishlistItemInput): Promise<WishlistItemDto> {
    await this.requireActiveCustomer(userId);
    const wishlist = await this.repository.findOrCreateWishlist(userId);

    const product = await this.repository.findActiveInProduct(input.productId, ECOMMERCE_SITE_CODE);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    let variantId = input.variantId ?? null;
    if (variantId) {
      const variant = await this.repository.findVariantForProduct(input.productId, variantId);
      if (!variant) {
        throw new ValidationError('Variant does not belong to this product');
      }
    } else if (product.variants[0]) {
      variantId = product.variants[0].id;
    }

    const existing = await this.repository.findExistingItem(wishlist.id, input.productId);
    if (existing) {
      throw new ConflictError('Product is already in the wishlist');
    }

    const item = await this.repository.addItem(wishlist.id, input.productId, variantId);
    logger.info(
      {
        event: 'wishlist.item_added',
        userId,
        productId: input.productId,
      },
      'Wishlist item added',
    );
    return this.toItemDto(item);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.requireActiveCustomer(userId);
    const item = await this.repository.findItemForUser(userId, itemId);
    if (!item) {
      throw new NotFoundError('Wishlist item not found');
    }
    await this.repository.deleteItem(item.id);
    logger.info(
      {
        event: 'wishlist.item_removed',
        userId,
        itemId,
      },
      'Wishlist item removed',
    );
  }

  /**
   * Merge guest wishlist product refs into the account wishlist (union by productId).
   * Naturally idempotent via @@unique([wishlistId, productId]); Idempotency-Key is accepted
   * by the controller for client retries but does not require a separate store.
   */
  async syncWishlist(userId: string, input: SyncWishlistInput): Promise<WishlistSyncResultDto> {
    await this.requireActiveCustomer(userId);
    const wishlist = await this.repository.findOrCreateWishlist(userId);

    const deduped = new Map<string, { productId: string; variantId: string | null }>();
    for (const raw of input.items) {
      if (!deduped.has(raw.productId)) {
        deduped.set(raw.productId, {
          productId: raw.productId,
          variantId: raw.variantId ?? null,
        });
      }
    }

    const skipped: WishlistSyncSkippedItem[] = [];
    const toInsert: Array<{ productId: string; variantId: string | null }> = [];

    for (const entry of deduped.values()) {
      const existing = await this.repository.findExistingItem(wishlist.id, entry.productId);
      if (existing) {
        continue;
      }

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

      // Invalid guest variantIds must not drop the product — fall back to default/null.
      let variantId = entry.variantId;
      if (variantId) {
        const variant = await this.repository.findVariantForProduct(entry.productId, variantId);
        if (!variant) {
          skipped.push({
            productId: entry.productId,
            variantId: entry.variantId,
            reason: 'INVALID_VARIANT',
          });
          variantId = product.variants[0]?.id ?? null;
        }
      } else if (product.variants[0]) {
        variantId = product.variants[0].id;
      }

      toInsert.push({ productId: entry.productId, variantId });
    }

    await this.repository.addItemsIgnoreDuplicates(wishlist.id, toInsert);

    const refreshed = await this.repository.findOrCreateWishlist(userId);
    logger.info(
      {
        event: 'wishlist.sync',
        userId,
        inserted: toInsert.length,
        skipped: skipped.length,
      },
      'Wishlist synced from guest bag',
    );

    return {
      wishlist: this.toWishlistDto(refreshed),
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

  private toWishlistDto(wishlist: WishlistWithItems): WishlistDto {
    return {
      id: wishlist.id,
      items: wishlist.items.filter((item) => this.isEligibleStorefrontItem(item)).map((item) => this.toItemDto(item)),
    };
  }

  private isEligibleStorefrontItem(item: WishlistItemRow): boolean {
    return (
      item.product.status === 'ACTIVE' &&
      item.product.site.isActive &&
      item.product.site.code === ECOMMERCE_SITE_CODE
    );
  }

  private toItemDto(item: WishlistItemRow): WishlistItemDto {
    const variant = item.variant ?? item.product.variants[0] ?? null;
    const inventory = variant?.inventory;
    const availableQty =
      inventory != null
        ? inventory.quantityOnHand - inventory.quantityReserved
        : null;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.media[0]?.media.url ?? null,
      price: variant ? variant.price.toString() : null,
      currency: variant?.currency ?? null,
      available: availableQty == null ? item.product.status === 'ACTIVE' : availableQty > 0,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

export const wishlistService = new WishlistService();
