"use client";

import { cartService } from "@/features/cart/cart.service";
import { mapAccountCartItemToCartItem } from "@/features/cart/map-account-cart-item";
import {
  clearGuestCart,
  readGuestCart,
  writeGuestCart,
  type GuestCartItem,
} from "@/lib/guest-cart-storage";
import { showError, showSuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toApiError } from "@/services/api/errors";
import {
  cartLineId,
  clearCart,
  removeCartItem,
  setCartItems,
  updateCartItemQuantity,
  upsertCartItem,
} from "@/store/slices/cartSlice";
import type { CartItem } from "@/types/cart";

export type CartAddInput = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  variantLabel?: string;
  quantity?: number;
  unitPriceInPaise: number;
  originalUnitPriceInPaise?: number;
  discountCode?: string | null;
  discountInPaise?: number;
};

function toGuestBagItem(item: CartItem): GuestCartItem | null {
  if (!item.variantId) return null;
  return {
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    productName: item.name,
    productSlug: item.slug,
    imageUrl: item.image || null,
    variantLabel: item.variantLabel,
    unitPriceInPaise: item.unitPriceInPaise,
    originalUnitPriceInPaise: item.originalUnitPriceInPaise,
    discountCode: item.discountCode ?? null,
    discountInPaise: item.discountInPaise,
  };
}

function persistGuestFromItems(items: CartItem[]): boolean {
  const bag = items
    .map(toGuestBagItem)
    .filter((item): item is GuestCartItem => item != null);
  return writeGuestCart(bag);
}

/**
 * Auth-aware cart mutations — guests use Redux + localStorage; customers use the API.
 */
export function useCartActions() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const items = useAppSelector((state) => state.cart.items);

  async function add(input: CartAddInput): Promise<boolean> {
    if (authLoading) {
      showError("Please wait a moment, then try again.", {
        id: "cart.add.error",
      });
      return false;
    }

    if (!input.variantId) {
      showError("Select a product option before adding to cart.", {
        id: "cart.add.error",
      });
      return false;
    }

    const quantity = input.quantity ?? 1;

    if (!isAuthenticated) {
      const lineId = cartLineId(input.productId, input.variantId);
      const existing = items.find(
        (item) =>
          item.id === lineId ||
          (item.productId === input.productId &&
            item.variantId === input.variantId),
      );
      const merged: CartItem = existing
        ? {
            ...existing,
            id: lineId,
            quantity: existing.quantity + quantity,
            unitPriceInPaise: input.unitPriceInPaise,
            originalUnitPriceInPaise: input.originalUnitPriceInPaise,
            discountCode: input.discountCode,
            discountInPaise: input.discountInPaise,
            variantLabel: input.variantLabel,
            image: input.image,
            alt: input.alt,
            name: input.name,
            slug: input.slug,
          }
        : {
            id: lineId,
            productId: input.productId,
            variantId: input.variantId,
            slug: input.slug,
            name: input.name,
            image: input.image,
            alt: input.alt,
            variantLabel: input.variantLabel,
            quantity,
            unitPriceInPaise: input.unitPriceInPaise,
            originalUnitPriceInPaise: input.originalUnitPriceInPaise,
            discountCode: input.discountCode,
            discountInPaise: input.discountInPaise,
          };
      const nextItems = [
        merged,
        ...items.filter(
          (item) =>
            !(
              item.productId === input.productId &&
              item.variantId === input.variantId
            ),
        ),
      ];
      dispatch(setCartItems(nextItems));
      const persisted = persistGuestFromItems(nextItems);
      if (!persisted) {
        showError("Could not save cart in this browser.", {
          id: "cart.add.error",
        });
        return false;
      }
      showSuccess("Added to cart.", { id: "cart.add" });
      return true;
    }

    try {
      const item = await cartService.addItem({
        productId: input.productId,
        variantId: input.variantId,
        quantity,
      });
      dispatch(upsertCartItem(mapAccountCartItemToCartItem(item)));
      showSuccess("Added to cart.", { id: "cart.add" });
      return true;
    } catch (error) {
      showError(toApiError(error).message || "Could not add to cart.", {
        id: "cart.add.error",
      });
      return false;
    }
  }

  async function setQuantity(itemId: string, quantity: number): Promise<boolean> {
    if (authLoading) {
      showError("Please wait a moment, then try again.", {
        id: "cart.qty.error",
      });
      return false;
    }

    const previous = items;
    const capped = Math.max(1, quantity);

    if (!isAuthenticated) {
      dispatch(updateCartItemQuantity({ id: itemId, quantity: capped }));
      const next = previous.map((item) =>
        item.id === itemId ? { ...item, quantity: capped } : item,
      );
      persistGuestFromItems(next);
      return true;
    }

    dispatch(updateCartItemQuantity({ id: itemId, quantity: capped }));
    try {
      const item = await cartService.updateItem(itemId, { quantity: capped });
      dispatch(upsertCartItem(mapAccountCartItemToCartItem(item)));
      return true;
    } catch (error) {
      dispatch(setCartItems(previous));
      showError(toApiError(error).message || "Could not update quantity.", {
        id: "cart.qty.error",
      });
      return false;
    }
  }

  async function remove(itemId: string): Promise<boolean> {
    if (authLoading) {
      showError("Please wait a moment, then try again.", {
        id: "cart.remove.error",
      });
      return false;
    }

    const previous = items;
    dispatch(removeCartItem(itemId));

    if (!isAuthenticated) {
      const next = previous.filter((item) => item.id !== itemId);
      persistGuestFromItems(next);
      showSuccess("Removed from cart.", { id: "cart.remove" });
      return true;
    }

    try {
      await cartService.removeItem(itemId);
      showSuccess("Removed from cart.", { id: "cart.remove" });
      return true;
    } catch (error) {
      dispatch(setCartItems(previous));
      showError(toApiError(error).message || "Could not remove item.", {
        id: "cart.remove.error",
      });
      return false;
    }
  }

  async function clear(): Promise<boolean> {
    if (authLoading) return false;

    if (!isAuthenticated) {
      dispatch(clearCart());
      clearGuestCart();
      return true;
    }

    try {
      const cart = await cartService.clear();
      dispatch(setCartItems(cart.items.map(mapAccountCartItemToCartItem)));
      return true;
    } catch (error) {
      showError(toApiError(error).message || "Could not clear cart.", {
        id: "cart.clear.error",
      });
      return false;
    }
  }

  return {
    items,
    authLoading,
    add,
    setQuantity,
    remove,
    clear,
    readGuestCart,
    clearGuestCart,
  };
}
