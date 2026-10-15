"use client";

import { useEffect, useRef } from "react";
import { useStore } from "react-redux";

import { cartService } from "@/features/cart/cart.service";
import type { AccountCartItem } from "@/features/cart/cart.types";
import { mapAccountCartItemToCartItem } from "@/features/cart/map-account-cart-item";
import { wishlistService } from "@/features/wishlist/wishlist.service";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  ACCOUNT_CART_CACHE_KEY,
  clearGuestCart,
  GUEST_CART_STORAGE_KEY,
  readAccountCartCache,
  readCartLocalPaint,
  readGuestCart,
  toCartSyncPayload,
  writeAccountCartCache,
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
    productCode: item.productCode ?? null,
    categoryName: item.categoryName ?? null,
    imageUrl: item.imageUrl ?? null,
    price: item.price ?? null,
    currency: item.currency ?? null,
    available: item.available ?? true,
    quantity: item.quantity,
    cgstPercent: item.cgstPercent ?? 0,
    sgstPercent: item.sgstPercent ?? 0,
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
    categoryName: item.categoryName ?? null,
    productCode: item.productCode ?? null,
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    unitPriceInPaise: item.unitPriceInPaise ?? 0,
    originalUnitPriceInPaise: item.originalUnitPriceInPaise,
    discountCode: item.discountCode ?? null,
    discountInPaise: item.discountInPaise,
    cgstPercent: item.cgstPercent ?? 0,
    sgstPercent: item.sgstPercent ?? 0,
  }));
}

function cartItemsToGuestBag(items: CartItem[]): GuestCartItem[] {
  return items
    .filter((item) => Boolean(item.variantId))
    .map((item) => ({
      productId: item.productId,
      variantId: item.variantId!,
      quantity: item.quantity,
      productName: item.name,
      productSlug: item.slug,
      categoryName: item.categoryName ?? null,
      productCode: item.productCode ?? null,
      imageUrl: item.image || null,
      variantLabel: item.variantLabel,
      unitPriceInPaise: item.unitPriceInPaise,
      originalUnitPriceInPaise: item.originalUnitPriceInPaise,
      discountCode: item.discountCode ?? null,
      discountInPaise: item.discountInPaise,
      cgstPercent: item.cgstPercent ?? 0,
      sgstPercent: item.sgstPercent ?? 0,
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

function lineKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? ""}`;
}

/**
 * Union local + server lines. Local-only products are kept (DB=2, LS=3 → 3).
 * Overlaps take max quantity and prefer server ids/pricing with local image fallback.
 */
function unionCartItems(
  localItems: CartItem[],
  serverItems: AccountCartItem[],
): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const server of serverItems) {
    const key = lineKey(server.productId, server.variantId);
    map.set(key, mapAccountCartItemToCartItem(server));
  }

  for (const local of localItems) {
    const key = lineKey(local.productId, local.variantId);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, local);
      continue;
    }
    map.set(key, {
      ...existing,
      quantity: Math.max(existing.quantity, local.quantity),
      image: existing.image || local.image,
      alt: existing.alt || local.alt,
      name: existing.name || local.name,
      slug: existing.slug || local.slug,
      variantLabel: existing.variantLabel ?? local.variantLabel,
    });
  }

  return Array.from(map.values());
}

async function pushLocalOnlyLinesToAccount(
  merged: CartItem[],
  serverItems: AccountCartItem[],
): Promise<CartItem[]> {
  const serverByKey = new Map(
    serverItems.map((item) => [lineKey(item.productId, item.variantId), item]),
  );
  let next = merged;

  for (const line of merged) {
    if (!line.variantId) continue;
    const key = lineKey(line.productId, line.variantId);
    const server = serverByKey.get(key);
    try {
      if (!server) {
        const created = await cartService.addItem({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
        });
        const mapped = mapAccountCartItemToCartItem(created, line.image);
        next = next.map((row) =>
          lineKey(row.productId, row.variantId) === key ? mapped : row,
        );
      } else if (line.quantity > server.quantity) {
        const updated = await cartService.updateItem(server.id, {
          quantity: line.quantity,
        });
        const mapped = mapAccountCartItemToCartItem(updated, line.image);
        next = next.map((row) =>
          lineKey(row.productId, row.variantId) === key ? mapped : row,
        );
      }
    } catch {
      // Keep local line; account catch-up can retry on next hydrate.
    }
  }

  return next;
}

/**
 * Guest LS hydrate + post-auth cart/wishlist merge.
 * Cart: paint localStorage first, then DB — local-only lines are kept and pushed up.
 */
export function CartWishlistSyncBridge() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const { isAuthenticated, isUnauthenticated, user } = useAuth();
  const authStatus = useAppSelector((state) => state.auth.status);
  const wishlistHydrated = useAppSelector((state) => state.wishlist.hydrated);
  const cartHydrated = useAppSelector((state) => state.cart.hydrated);
  const guestHydrateDone = useRef(false);
  const cartLsHydrateDone = useRef(false);

  // Instant cart paint from localStorage (before auth finishes).
  useEffect(() => {
    if (cartLsHydrateDone.current) return;
    cartLsHydrateDone.current = true;
    const bag = readCartLocalPaint();
    if (bag.items.length === 0) return;
    if (store.getState().cart.items.length > 0) return;
    dispatch(setCartItems(guestItemsToCartItems(bag.items)));
  }, [dispatch, store]);

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
              productCode: item.productCode ?? null,
              categoryName: item.categoryName ?? null,
              imageUrl: item.imageUrl,
              price: item.price,
              currency: item.currency,
              available: item.available,
              quantity: item.quantity,
              cgstPercent: item.cgstPercent ?? 0,
              sgstPercent: item.sgstPercent ?? 0,
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
          writeGuestCart(cartItemsToGuestBag(currentCart));
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

    if (lastSyncedUserId === user.id && !inFlightSync) {
      return;
    }

    const run = async () => {
      dispatch(setWishlistStatus("syncing"));
      dispatch(setCartStatus("syncing"));

      const wishlistBag = readGuestWishlist();
      const wishlistSyncItems = toSyncPayload(wishlistBag);
      const guestCartBag = readGuestCart();
      const guestCartSyncItems = toCartSyncPayload(guestCartBag);
      const accountCache = readAccountCartCache();
      const localPaint =
        guestCartBag.items.length > 0
          ? guestItemsToCartItems(guestCartBag.items)
          : accountCache.items.length > 0
            ? guestItemsToCartItems(accountCache.items)
            : store.getState().cart.items;

      // Paint LS / cache immediately for logged-in users (before network).
      if (localPaint.length > 0) {
        dispatch(setCartItems(localPaint));
      }

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
        let serverItems: AccountCartItem[] = [];

        // Guest bag only → additive /cart/sync (login merge). Never sync account cache.
        if (guestCartSyncItems.length > 0) {
          const key = `cart-sync:${user.id}:${hashGuestCartPayload(guestCartSyncItems)}`;
          const result = await cartService.sync(
            { items: guestCartSyncItems },
            key,
          );
          serverItems = result.cart.items;
          const mergedKeys = new Set(
            result.cart.items.map((item) =>
              lineKey(item.productId, item.variantId),
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
              .map((row) => lineKey(row.productId, row.variantId)),
          );
          const allAccountedFor = guestCartSyncItems.every(
            (item) =>
              mergedKeys.has(lineKey(item.productId, item.variantId)) ||
              permanentlySkipped.has(lineKey(item.productId, item.variantId)),
          );
          if (allAccountedFor) {
            clearGuestCart();
          }
        } else {
          const cart = await cartService.get();
          serverItems = cart.items;
        }

        // Union so LS/cache-only products are not dropped (DB=2, local=3 → keep 3).
        const localNow =
          store.getState().cart.items.length > 0
            ? store.getState().cart.items
            : localPaint;
        let merged = unionCartItems(localNow, serverItems);
        merged = await pushLocalOnlyLinesToAccount(merged, serverItems);
        dispatch(setCartItems(merged));
        writeAccountCartCache(cartItemsToGuestBag(merged));
        cartOk = true;
      } catch {
        dispatch(setCartError("Unable to sync cart."));
        showError("Could not sync your cart. Local items were kept.", {
          id: "cart.sync.error",
        });
        if (localPaint.length > 0) {
          dispatch(setCartItems(localPaint));
          if (guestCartBag.items.length > 0) {
            writeGuestCart(guestCartBag.items);
          } else {
            writeAccountCartCache(cartItemsToGuestBag(localPaint));
          }
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
      if (event.key === GUEST_WISHLIST_STORAGE_KEY) {
        if (isAuthenticated) return;
        const bag = readGuestWishlist();
        dispatch(setWishlistItems(guestItemsToWishlistItems(bag.items)));
      }

      if (event.key === GUEST_CART_STORAGE_KEY) {
        if (isAuthenticated) return;
        const bag = readGuestCart();
        if (bag.items.length === 0) return;
        dispatch(setCartItems(guestItemsToCartItems(bag.items)));
      }

      // Logged-in cross-tab: paint account cache immediately (no empty flash).
      if (event.key === ACCOUNT_CART_CACHE_KEY) {
        const bag = readAccountCartCache();
        if (bag.items.length === 0) return;
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
