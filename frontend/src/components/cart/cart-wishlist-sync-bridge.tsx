"use client";

import { useEffect, useRef } from "react";
import { useStore } from "react-redux";

import { wishlistService } from "@/features/wishlist/wishlist.service";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  clearGuestWishlist,
  readGuestWishlist,
  toSyncPayload,
  writeGuestWishlist,
  type GuestWishlistItem,
} from "@/lib/guest-wishlist-storage";
import { showError } from "@/lib/toast";
import type { RootState } from "@/store";
import {
  setWishlistError,
  setWishlistItems,
  setWishlistStatus,
} from "@/store/slices/wishlistSlice";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";

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
  }));
}

function hashGuestPayload(items: ReturnType<typeof toSyncPayload>): string {
  return items
    .map((item) => `${item.productId}:${item.variantId ?? ""}`)
    .sort()
    .join("|");
}

/**
 * Post-auth wishlist hydrate/sync. Cart sync is intentionally omitted until cart CRUD ships;
 * this bridge only clears guest wishlist storage after a successful wishlist merge.
 */
export function CartWishlistSyncBridge() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const { isAuthenticated, isUnauthenticated, user } = useAuth();
  const authStatus = useAppSelector((state) => state.auth.status);
  const wishlistHydrated = useAppSelector((state) => state.wishlist.hydrated);
  const guestHydrateDone = useRef(false);

  useEffect(() => {
    if (authStatus === "idle" || authStatus === "loading") {
      return;
    }

    if (isUnauthenticated) {
      if (guestHydrateDone.current && wishlistHydrated) {
        return;
      }
      guestHydrateDone.current = true;
      lastSyncedUserId = null;
      const bag = readGuestWishlist();
      const fromBag = guestItemsToWishlistItems(bag.items);

      if (fromBag.length > 0) {
        dispatch(setWishlistItems(fromBag));
        return;
      }

      // Guest may have added during AuthBootstrap before this effect ran.
      // Do not wipe Redux with an empty bag; re-persist and mark hydrated.
      const currentItems = store.getState().wishlist.items;
      if (currentItems.length > 0) {
        writeGuestWishlist(
          currentItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSlug: item.productSlug,
            imageUrl: item.imageUrl,
            price: item.price,
            currency: item.currency,
            available: item.available,
          })),
        );
        dispatch(setWishlistItems(currentItems));
        return;
      }

      dispatch(setWishlistItems([]));
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
      const bag = readGuestWishlist();
      const syncItems = toSyncPayload(bag);

      try {
        if (syncItems.length === 0) {
          const wishlist = await wishlistService.get();
          dispatch(setWishlistItems(wishlist.items));
        } else {
          const key = `wishlist-sync:${user.id}:${hashGuestPayload(syncItems)}`;
          const result = await wishlistService.sync({ items: syncItems }, key);
          dispatch(setWishlistItems(result.wishlist.items));
          // Only clear guest storage after the account wishlist contains the
          // guest product ids (or they were skipped as permanently invalid).
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
          const allAccountedFor = syncItems.every(
            (item) =>
              mergedIds.has(item.productId) ||
              permanentlySkipped.has(item.productId),
          );
          if (allAccountedFor) {
            clearGuestWishlist();
          }
        }
        lastSyncedUserId = user.id;
      } catch {
        dispatch(setWishlistError("Unable to sync wishlist."));
        showError("Could not sync your wishlist. Guest items were kept.", {
          id: "wishlist.sync.error",
        });
        // Preserve guest bag for retry; still expose guest display until success.
        if (bag.items.length > 0) {
          dispatch(setWishlistItems(guestItemsToWishlistItems(bag.items)));
          writeGuestWishlist(bag.items);
        } else {
          // Ensure the wishlist page is not stuck on a non-hydrated loading state.
          dispatch(setWishlistItems([]));
        }
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
    dispatch,
    isAuthenticated,
    isUnauthenticated,
    store,
    user,
    wishlistHydrated,
  ]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "skindx.guest.wishlist.v1") return;
      if (isAuthenticated) return;
      const bag = readGuestWishlist();
      dispatch(setWishlistItems(guestItemsToWishlistItems(bag.items)));
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
