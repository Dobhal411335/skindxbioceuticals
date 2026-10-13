import { prisma } from '@/lib/prisma';

const wishlistItemInclude = {
  product: {
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' as const },
        take: 1,
        include: { inventory: true },
      },
      media: {
        orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
        take: 1,
        include: { media: true },
      },
      site: true,
    },
  },
  variant: {
    include: { inventory: true },
  },
};

/**
 * Wishlist repository — customer wishlist data access.
 */
export class WishlistRepository {
  protected readonly db = prisma;

  async findOrCreateWishlist(userId: string) {
    const existing = await this.db.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: wishlistItemInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.db.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: wishlistItemInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findActiveInProduct(productId: string, siteCode = 'IN') {
    return this.db.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
        site: { code: siteCode, isActive: true },
      },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async findProductEligibility(productId: string) {
    return this.db.product.findUnique({
      where: { id: productId },
      include: {
        site: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async findVariantForProduct(productId: string, variantId: string) {
    return this.db.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        isActive: true,
      },
    });
  }

  async addItem(wishlistId: string, productId: string, variantId: string | null) {
    return this.db.wishlistItem.create({
      data: {
        wishlistId,
        productId,
        variantId,
      },
      include: wishlistItemInclude,
    });
  }

  /**
   * Insert guest sync lines; unique (wishlistId, productId) conflicts are ignored.
   */
  async addItemsIgnoreDuplicates(
    wishlistId: string,
    items: Array<{ productId: string; variantId: string | null }>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await this.db.wishlistItem.createMany({
      data: items.map((item) => ({
        wishlistId,
        productId: item.productId,
        variantId: item.variantId,
      })),
      skipDuplicates: true,
    });
  }

  async findItemForUser(userId: string, itemId: string) {
    return this.db.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: { userId },
      },
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.db.wishlistItem.delete({ where: { id: itemId } });
  }

  async findExistingItem(wishlistId: string, productId: string) {
    return this.db.wishlistItem.findUnique({
      where: {
        wishlistId_productId: { wishlistId, productId },
      },
      include: wishlistItemInclude,
    });
  }
}

export const wishlistRepository = new WishlistRepository();