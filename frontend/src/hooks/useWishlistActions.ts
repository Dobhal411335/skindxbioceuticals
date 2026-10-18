"use client";

import {
  clearGuestWishlist,
  readGuestWishlist,
  writeGuestWishlist,
  type GuestWishlistItem,
} from "@/lib/guest-wishlist-storage";
import { showError, showSuccess } from "@/lib/toast";
import { wishlistService } from "@/features/wishlist/wishlist.service";
import type {
  WishlistItem,
  WishlistItemCoupon,
} from "@/features/wishlist/wishlist.types";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toApiError } from "@/services/api/errors";
import {
  removeWishlistItem,
  selectIsProductInWishlist,
  setWishlistItems,
  upsertWishlistItem,
} from "@/store/slices/wishlistSlice";

export type WishlistAddInput = {
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  productCode?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  price?: string | null;
  currency?: string | null;
  available?: boolean;
  quantity?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  coupon?: WishlistItemCoupon | null;
};

function guestItemId(productId: string): string {
  return `guest:${productId}`;
}

function toGuestBagItem(item: WishlistItem): GuestWishlistItem {
  return {
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    productSlug: item.productSlug,
    productCode: item.productCode ?? null,
    categoryName: item.categoryName ?? null,
    imageUrl: item.imageUrl,
    price: item.price,
    currency: item.currency,
    available: item.available,
    quantity: item.quantity,
    cgstPercent: item.cgstPercent,
    sgstPercent: item.sgstPercent,
    coupon: item.coupon ?? null,
  };
}

function persistGuestFromItems(items: WishlistItem[]): boolean {
  return writeGuestWishlist(items.map(toGuestBagItem));
}

/**
 * Auth-aware wishlist mutations — guests/vendors use Redux + localStorage;
 * customers use the account wishlist API (CUSTOMER-only).
 */
export function useWishlistActions() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const items = useAppSelector((state) => state.wishlist.items);
  const usesAccountWishlist = isAuthenticated && user?.role === "CUSTOMER";

  const isInWishlist = (productId: string) =>
    items.some((item) => item.productId === productId);

  const findByProductId = (productId: string) =>
    items.find((item) => item.productId === productId);

  async function add(input: WishlistAddInput): Promise<boolean> {
    // Wait until auth bootstrap finishes so we do not write guest LS and then
    // immediately sync/clear it under a restored session.
    if (authLoading) {
      showError("Please wait a moment, then try saving again.", {
        id: "wishlist.add.error",
      });
      return false;
    }

    if (isInWishlist(input.productId)) {
      return true;
    }

    if (!usesAccountWishlist) {
      const variantId =
        input.variantId && String(input.variantId).trim()
          ? String(input.variantId)
          : null;
      const next: WishlistItem = {
        id: guestItemId(input.productId),
        productId: input.productId,
        variantId,
        productName: input.productName,
        productSlug: input.productSlug,
        imageUrl: input.imageUrl ? String(input.imageUrl) : null,
        price:
          input.price === undefined || input.price === null
            ? null
            : String(input.price),
        currency: input.currency ?? null,
        available: input.available ?? true,
        quantity: input.quantity,
        productCode: input.productCode ?? null,
        categoryName: input.categoryName ?? null,
        cgstPercent: input.cgstPercent ?? 0,
        sgstPercent: input.sgstPercent ?? 0,
        createdAt: new Date().toISOString(),
        coupon: input.coupon ?? null,
      };
      const nextItems = [
        next,
        ...items.filter((item) => item.productId !== input.productId),
      ];
      dispatch(setWishlistItems(nextItems));
      const persisted = persistGuestFromItems(nextItems);
      if (!persisted) {
        showError("Could not save wishlist in this browser.", {
          id: "wishlist.add.error",
        });
        return false;
      }
      showSuccess("Added to wishlist.", { id: "wishlist.add" });
      return true;
    }

    try {
      const item = await wishlistService.add({
        productId: input.productId,
        variantId: input.variantId ?? null,
      });
      dispatch(upsertWishlistItem(item));
      showSuccess("Added to wishlist.", { id: "wishlist.add" });
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.statusCode === 409) {
        try {
          const wishlist = await wishlistService.get();
          dispatch(setWishlistItems(wishlist.items));
        } catch {
          // keep local state
        }
        showSuccess("Already in wishlist.", { id: "wishlist.add" });
        return true;
      }
      showError(apiError.message || "Could not add to wishlist.", {
        id: "wishlist.add.error",
      });
      return false;
    }
  }

  async function remove(itemId: string): Promise<boolean> {
    if (authLoading) {
      showError("Please wait a moment, then try again.", {
        id: "wishlist.remove.error",
      });
      return false;
    }

    const previous = items;
    dispatch(removeWishlistItem(itemId));

    if (!usesAccountWishlist) {
      const nextItems = previous.filter((item) => item.id !== itemId);
      persistGuestFromItems(nextItems);
      showSuccess("Removed from wishlist.", { id: "wishlist.remove" });
      return true;
    }

    try {
      await wishlistService.remove(itemId);
      showSuccess("Removed from wishlist.", { id: "wishlist.remove" });
      return true;
    } catch (error) {
      dispatch(setWishlistItems(previous));
      showError(toApiError(error).message || "Unable to remove item.", {
        id: "wishlist.remove.error",
      });
      return false;
    }
  }

  async function toggle(
    input: WishlistAddInput,
  ): Promise<"added" | "removed" | "error"> {
    const existing = findByProductId(input.productId);
    if (existing) {
      const ok = await remove(existing.id);
      return ok ? "removed" : "error";
    }
    const ok = await add(input);
    return ok ? "added" : "error";
  }

  return {
    items,
    authLoading,
    isInWishlist,
    findByProductId,
    add,
    remove,
    toggle,
    selectIsProductInWishlist,
    readGuestWishlist,
    clearGuestWishlist,
  };
}
