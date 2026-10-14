import { prisma } from '@/lib/prisma';

const cartItemInclude = {
  product: {
    include: {
      media: {
        orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
        take: 1,
        include: { media: true },
      },
      site: true,
      coupon: { include: { coupon: true } },
    },
  },
  variant: {
    include: { inventory: true },
  },
};

/**
 * Cart repository — Prisma data access for account carts.
 */
export class CartRepository {
  protected readonly db = prisma;

  async findOrCreateCart(userId: string) {
    const existing = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: cartItemInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.db.cart.create({
      data: { userId },
      include: {
        items: {
          include: cartItemInclude,
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
          include: { inventory: true },
        },
        coupon: { include: { coupon: true } },
        site: true,
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
          include: { inventory: true },
        },
        coupon: { include: { coupon: true } },
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
      include: { inventory: true },
    });
  }

  async findItemByVariant(cartId: string, variantId: string) {
    return this.db.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId, variantId },
      },
      include: cartItemInclude,
    });
  }

  async findItemForUser(userId: string, itemId: string) {
    return this.db.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: cartItemInclude,
    });
  }

  async upsertItem(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number,
  ) {
    return this.db.cartItem.upsert({
      where: {
        cartId_variantId: { cartId, variantId },
      },
      create: {
        cartId,
        productId,
        variantId,
        quantity,
      },
      update: {
        quantity,
        productId,
      },
      include: cartItemInclude,
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    return this.db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: cartItemInclude,
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.db.cartItem.delete({ where: { id: itemId } });
  }

  async clearItems(cartId: string): Promise<void> {
    await this.db.cartItem.deleteMany({ where: { cartId } });
  }
}

export const cartRepository = new CartRepository();
