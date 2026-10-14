"use client";

import { useEffect, useRef } from "react";
import { useStore } from "react-redux";

import { cartService } from "@/features/cart/cart.service";
import { mapAccountCartItemToCartItem } from "@/features/cart/map-account-cart-item";
import { wishlistService } from "@/features/wishlist/wishlist.service";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  clearGuestCart,
  GUEST_CART_STORAGE_KEY,
  readGuestCart,
  toCartSyncPayload,
  writeGuestCart,
  type GuestCartItem,
} from "@/lib/guest-cart-storage";
import {
  clearGuestWishlist,
  GUEST_WISHLIST_STORAGE_KEY,
  readGuestWishlist,
  toSyncPayload,
  writeGuestWishlist,
  type GuestWishlistItem,
} from "@/lib/guest-wishlist-storage";
import { showError } from "@/lib/toast";
import type { RootState } from "@/store";
import {
  setCartError,
  setCartItems,
  setCartStatus,
} from "@/store/slices/cartSlice";
import {
  setWishlistError,
  setWishlistItems,
  setWishlistStatus,
} from "@/store/slices/wishlistSlice";
import type { CartItem } from "@/types/cart";

let inFlightSync: Promise<void> | null = null;
let lastSyncedUserId: string | null = null;

function guestItemsToWishlistItems(items: GuestWishlistItem[]): WishlistItem[] {
  return items.map((item) => ({
    id: `guest:${item.productId}`,
    productId: item.productId,
    variantId: item.variantId ?? null,
    productName: item.productName ?? "Saved product",
    productSlug: item.productSlug ?? "",
    imageUrl: item.imageUrl ?? null,
    price: item.price ?? null,
    currency: item.currency ?? null,
    available: item.available ?? true,
    createdAt: new Date(0).toISOString(),
    coupon: item.coupon ?? null,
  }));
}

function guestItemsToCartItems(items: GuestCartItem[]): CartItem[] {
  return items.map((item) => ({
    id: `${item.productId}:${item.variantId}`,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.productSlug ?? "",
    name: item.productName ?? "Product",
    image: item.imageUrl ?? "",
    alt: item.productName ?? "Product",
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    unitPriceInPaise: item.unitPriceInPaise ?? 0,
    originalUnitPriceInPaise: item.originalUnitPriceInPaise,
    discountCode: item.discountCode ?? null,
    discountInPaise: item.discountInPaise,
  }));
}

function hashGuestWishlistPayload(
  items: ReturnType<typeof toSyncPayload>,
): string {
  return items
    .map((item) => `${item.productId}:${item.variantId ?? ""}`)
    .sort()
    .join("|");
}

function hashGuestCartPayload(
  items: ReturnType<typeof toCartSyncPayload>,
): string {
  return items
    .map((item) => `${item.productId}:${item.variantId}:${item.quantity}`)
    .sort()
    .join("|");
}

/**
 * Guest LS hydrate + post-auth cart/wishlist merge.
 */
export function CartWishlistSyncBridge() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const { isAuthenticated, isUnauthenticated, user } = useAuth();
  const authStatus = useAppSelector((state) => state.auth.status);
  const wishlistHydrated = useAppSelector((state) => state.wishlist.hydrated);
  const cartHydrated = useAppSelector((state) => state.cart.hydrated);
  const guestHydrateDone = useRef(false);

  useEffect(() => {
    if (authStatus === "idle" || authStatus === "loading") {
      return;
    }

    if (isUnauthenticated) {
      if (guestHydrateDone.current && wishlistHydrated && cartHydrated) {
        return;
      }
      guestHydrateDone.current = true;
      lastSyncedUserId = null;

      // Wishlist guest hydrate
      const wishlistBag = readGuestWishlist();
      const wishlistFromBag = guestItemsToWishlistItems(wishlistBag.items);
      if (wishlistFromBag.length > 0) {
        dispatch(setWishlistItems(wishlistFromBag));
      } else {
        const currentWishlist = store.getState().wishlist.items;
        if (currentWishlist.length > 0) {
          writeGuestWishlist(
            currentWishlist.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              productSlug: item.productSlug,
              imageUrl: item.imageUrl,
              price: item.price,
              currency: item.currency,
              available: item.available,
              coupon: item.coupon ?? null,
            })),
          );
          dispatch(setWishlistItems(currentWishlist));
        } else {
          dispatch(setWishlistItems([]));
        }
      }

      // Cart guest hydrate
      const cartBag = readGuestCart();
      const cartFromBag = guestItemsToCartItems(cartBag.items);
      if (cartFromBag.length > 0) {
        dispatch(setCartItems(cartFromBag));
      } else {
        const currentCart = store.getState().cart.items;
        if (currentCart.length > 0) {
          writeGuestCart(
            currentCart
              .filter((item) => Boolean(item.variantId))
              .map((item) => ({
                productId: item.productId,
                variantId: item.variantId!,
                quantity: item.quantity,
                productName: item.name,
                productSlug: item.slug,
                imageUrl: item.image || null,
                variantLabel: item.variantLabel,
                unitPriceInPaise: item.unitPriceInPaise,
                originalUnitPriceInPaise: item.originalUnitPriceInPaise,
                discountCode: item.discountCode ?? null,
                discountInPaise: item.discountInPaise,
              })),
          );
          dispatch(setCartItems(currentCart));
        } else {
          dispatch(setCartItems([]));
        }
      }
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    if (lastSyncedUserId === user.id && inFlightSync == null) {
      return;
    }

    const run = async () => {
      dispatch(setWishlistStatus("syncing"));
      dispatch(setCartStatus("syncing"));

      const wishlistBag = readGuestWishlist();
      const wishlistSyncItems = toSyncPayload(wishlistBag);
      const cartBag = readGuestCart();
      const cartSyncItems = toCartSyncPayload(cartBag);

      let wishlistOk = false;
      let cartOk = false;

      try {
        if (wishlistSyncItems.length === 0) {
          const wishlist = await wishlistService.get();
          dispatch(setWishlistItems(wishlist.items));
          wishlistOk = true;
        } else {
          const key = `wishlist-sync:${user.id}:${hashGuestWishlistPayload(wishlistSyncItems)}`;
          const result = await wishlistService.sync(
            { items: wishlistSyncItems },
            key,
          );
          dispatch(setWishlistItems(result.wishlist.items));
          const mergedIds = new Set(
            result.wishlist.items.map((item) => item.productId),
          );
          const permanentlySkipped = new Set(
            result.skipped
              .filter(
                (row) =>
                  row.reason === "INVALID_PRODUCT" ||
                  row.reason === "INACTIVE_OR_WRONG_SITE",
              )
              .map((row) => row.productId),
          );
          const allAccountedFor = wishlistSyncItems.every(
            (item) =>
              mergedIds.has(item.productId) ||
              permanentlySkipped.has(item.productId),
          );
          if (allAccountedFor) {
            clearGuestWishlist();
          }
          wishlistOk = true;
        }
      } catch {
        dispatch(setWishlistError("Unable to sync wishlist."));
        showError("Could not sync your wishlist. Guest items were kept.", {
          id: "wishlist.sync.error",
        });
        if (wishlistBag.items.length > 0) {
          dispatch(
            setWishlistItems(guestItemsToWishlistItems(wishlistBag.items)),
          );
          writeGuestWishlist(wishlistBag.items);
        } else {
          dispatch(setWishlistItems([]));
        }
      }

      try {
        if (cartSyncItems.length === 0) {
          const cart = await cartService.get();
          dispatch(setCartItems(cart.items.map(mapAccountCartItemToCartItem)));
          cartOk = true;
        } else {
          const key = `cart-sync:${user.id}:${hashGuestCartPayload(cartSyncItems)}`;
          const result = await cartService.sync(
            { items: cartSyncItems },
            key,
          );
          dispatch(
            setCartItems(result.cart.items.map(mapAccountCartItemToCartItem)),
          );
          const mergedKeys = new Set(
            result.cart.items.map(
              (item) => `${item.productId}:${item.variantId}`,
            ),
          );
          const permanentlySkipped = new Set(
            result.skipped
              .filter(
                (row) =>
                  row.reason === "INVALID_PRODUCT" ||
                  row.reason === "INACTIVE_OR_WRONG_SITE" ||
                  row.reason === "INVALID_VARIANT" ||
                  row.reason === "OUT_OF_STOCK",
              )
              .map((row) => `${row.productId}:${row.variantId ?? ""}`),
          );
          const allAccountedFor = cartSyncItems.every(
            (item) =>
              mergedKeys.has(`${item.productId}:${item.variantId}`) ||
              permanentlySkipped.has(`${item.productId}:${item.variantId}`),
          );
          if (allAccountedFor) {
            clearGuestCart();
          }
          cartOk = true;
        }
      } catch {
        dispatch(setCartError("Unable to sync cart."));
        showError("Could not sync your cart. Guest items were kept.", {
          id: "cart.sync.error",
        });
        if (cartBag.items.length > 0) {
          dispatch(setCartItems(guestItemsToCartItems(cartBag.items)));
          writeGuestCart(cartBag.items);
        } else {
          dispatch(setCartItems([]));
        }
      }

      if (wishlistOk && cartOk) {
        lastSyncedUserId = user.id;
      }
    };

    if (!inFlightSync) {
      inFlightSync = run().finally(() => {
        inFlightSync = null;
      });
    }

    void inFlightSync;
  }, [
    authStatus,
    cartHydrated,
    dispatch,
    isAuthenticated,
    isUnauthenticated,
    store,
    user,
    wishlistHydrated,
  ]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (isAuthenticated) return;
      if (event.key === GUEST_WISHLIST_STORAGE_KEY) {
        const bag = readGuestWishlist();
        dispatch(setWishlistItems(guestItemsToWishlistItems(bag.items)));
      }
      if (event.key === GUEST_CART_STORAGE_KEY) {
        const bag = readGuestCart();
        dispatch(setCartItems(guestItemsToCartItems(bag.items)));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch, isAuthenticated]);

  return null;
}

/** Test helper — reset module mutex between cases. */
export function __resetWishlistSyncBridgeForTests() {
  inFlightSync = null;
  lastSyncedUserId = null;
}
