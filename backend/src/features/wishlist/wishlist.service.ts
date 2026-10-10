import { authRepository } from '@/features/auth/auth.repository';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/AppError';
import { wishlistRepository } from './wishlist.repository';
import type { WishlistDto, WishlistItemDto } from './wishlist.types';
import type { AddWishlistItemInput } from './wishlist.validation';

type WishlistWithItems = Awaited<ReturnType<typeof wishlistRepository.findOrCreateWishlist>>;
type WishlistItemRow = WishlistWithItems['items'][number];

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
    return {
      id: wishlist.id,
      items: wishlist.items.map((item) => this.toItemDto(item)),
    };
  }

  async addItem(userId: string, input: AddWishlistItemInput): Promise<WishlistItemDto> {
    await this.requireActiveCustomer(userId);
    const wishlist = await this.repository.findOrCreateWishlist(userId);

    const product = await this.repository.findActiveInProduct(input.productId, 'IN');
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
    return this.toItemDto(item);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.requireActiveCustomer(userId);
    const item = await this.repository.findItemForUser(userId, itemId);
    if (!item) {
      throw new NotFoundError('Wishlist item not found');
    }
    await this.repository.deleteItem(item.id);
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
