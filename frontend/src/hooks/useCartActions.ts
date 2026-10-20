"use client";

import { cartService } from "@/features/cart/cart.service";
import { mapAccountCartItemToCartItem } from "@/features/cart/map-account-cart-item";
import {
  clearAccountCartCache,
  clearGuestCart,
  readGuestCart,
  writeAccountCartCache,
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
  setCartItemNote,
  setCartItems,
  updateCartItemQuantity,
  upsertCartItem,
} from "@/store/slices/cartSlice";
import type { CartItem } from "@/types/cart";

/** Delay before account-cart API write so UI stays instant. */
const AUTH_CART_SYNC_DELAY_MS = 800;

export type CartAddInput = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string;
  alt: string;
  categoryName?: string | null;
  productCode?: string | null;
  variantLabel?: string;
  quantity?: number;
  unitPriceInPaise: number;
  originalUnitPriceInPaise?: number;
  discountCode?: string | null;
  discountInPaise?: number;
  cgstPercent?: number;
  sgstPercent?: number;
};

function toGuestBagItem(item: CartItem): GuestCartItem | null {
  if (!item.variantId) return null;
  return {
    productId: item.productId,
    variantId: item.variantId,
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
    note: item.note,
  };
}

function itemsToBag(items: CartItem[]): GuestCartItem[] {
  return items
    .map(toGuestBagItem)
    .filter((item): item is GuestCartItem => item != null);
}

/** Guests → guest LS; logged-in → account display cache (cross-tab paint). */
function persistLocalCart(items: CartItem[], authenticated: boolean): boolean {
  const bag = itemsToBag(items);
  if (authenticated) {
    return writeAccountCartCache(bag);
  }
  return writeGuestCart(bag);
}

function mergeAddIntoItems(
  items: CartItem[],
  input: CartAddInput,
  quantity: number,
): { nextItems: CartItem[]; merged: CartItem } {
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
        // Keep server UUID when present; client lines use productId:variantId.
        id: zUuid(existing.id) ? existing.id : lineId,
        quantity: existing.quantity + quantity,
        unitPriceInPaise: input.unitPriceInPaise,
        originalUnitPriceInPaise: input.originalUnitPriceInPaise,
        discountCode: input.discountCode,
        discountInPaise: input.discountInPaise,
        cgstPercent: input.cgstPercent ?? existing.cgstPercent ?? 0,
        sgstPercent: input.sgstPercent ?? existing.sgstPercent ?? 0,
        variantLabel: input.variantLabel ?? existing.variantLabel,
        categoryName: input.categoryName ?? existing.categoryName ?? null,
        productCode: input.productCode ?? existing.productCode ?? null,
        image: input.image || existing.image,
        alt: input.alt || existing.alt,
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
        categoryName: input.categoryName ?? null,
        productCode: input.productCode ?? null,
        variantLabel: input.variantLabel,
        quantity,
        unitPriceInPaise: input.unitPriceInPaise,
        originalUnitPriceInPaise: input.originalUnitPriceInPaise,
        discountCode: input.discountCode,
        discountInPaise: input.discountInPaise,
        cgstPercent: input.cgstPercent ?? 0,
        sgstPercent: input.sgstPercent ?? 0,
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
  return { nextItems, merged };
}

function zUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Auth-aware cart mutations — guests use Redux + localStorage.
 * Logged-in users update Redux (+ local cache) immediately, then sync DB in the background.
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
    const { nextItems, merged } = mergeAddIntoItems(items, input, quantity);

    // Instant UI for everyone (guest + logged-in).
    dispatch(setCartItems(nextItems));
    const persisted = persistLocalCart(nextItems, isAuthenticated);
    if (!persisted && !isAuthenticated) {
      showError("Could not save cart in this browser.", {
        id: "cart.add.error",
      });
      return false;
    }
    showSuccess("Added to cart.", { id: "cart.add" });

    if (!isAuthenticated) {
      return true;
    }

    // Background account DB sync — do not block the UI.
    const productId = input.productId;
    const variantId = input.variantId;
    const clientImage = merged.image;

    window.setTimeout(() => {
      void (async () => {
        try {
          const item = await cartService.addItem({
            productId,
            variantId,
            quantity,
          });
          const mapped = mapAccountCartItemToCartItem(item);
          if (!mapped.image && clientImage) {
            mapped.image = clientImage;
            mapped.alt = mapped.alt || input.alt;
          }
          dispatch(upsertCartItem(mapped));
          // Refresh account cache with server ids after sync.
          const latest = [
            mapped,
            ...nextItems.filter(
              (row) =>
                !(
                  row.productId === productId && row.variantId === variantId
                ),
            ),
          ];
          persistLocalCart(latest, true);
        } catch (error) {
          showError(
            toApiError(error).message ||
              "Saved locally, but could not sync cart to your account.",
            { id: "cart.add.sync.error" },
          );
        }
      })();
    }, AUTH_CART_SYNC_DELAY_MS);

    return true;
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
    const target = previous.find((item) => item.id === itemId);
    const next = previous.map((item) =>
      item.id === itemId ? { ...item, quantity: capped } : item,
    );

    dispatch(updateCartItemQuantity({ id: itemId, quantity: capped }));
    persistLocalCart(next, isAuthenticated);

    if (!isAuthenticated) {
      return true;
    }

    window.setTimeout(() => {
      void (async () => {
        try {
          if (!target?.variantId) return;

          let serverItemId = zUuid(target.id) ? target.id : null;
          if (!serverItemId) {
            const cart = await cartService.get();
            serverItemId =
              cart.items.find(
                (row) =>
                  row.productId === target.productId &&
                  row.variantId === target.variantId,
              )?.id ?? null;
          }

          if (serverItemId) {
            const item = await cartService.updateItem(serverItemId, {
              quantity: capped,
            });
            const mapped = mapAccountCartItemToCartItem(item);
            if (!mapped.image && target.image) {
              mapped.image = target.image;
            }
            dispatch(upsertCartItem(mapped));
            persistLocalCart(
              next.map((row) => (row.id === itemId ? mapped : row)),
              true,
            );
          } else {
            const item = await cartService.addItem({
              productId: target.productId,
              variantId: target.variantId,
              quantity: capped,
            });
            const mapped = mapAccountCartItemToCartItem(item);
            if (!mapped.image && target.image) {
              mapped.image = target.image;
            }
            dispatch(upsertCartItem(mapped));
            persistLocalCart(
              next.map((row) => (row.id === itemId ? mapped : row)),
              true,
            );
          }
        } catch (error) {
          dispatch(setCartItems(previous));
          persistLocalCart(previous, true);
          showError(toApiError(error).message || "Could not update quantity.", {
            id: "cart.qty.error",
          });
        }
      })();
    }, AUTH_CART_SYNC_DELAY_MS);

    return true;
  }

  async function remove(itemId: string): Promise<boolean> {
    if (authLoading) {
      showError("Please wait a moment, then try again.", {
        id: "cart.remove.error",
      });
      return false;
    }

    const previous = items;
    const target = previous.find((item) => item.id === itemId);
    const next = previous.filter((item) => item.id !== itemId);
    dispatch(removeCartItem(itemId));
    persistLocalCart(next, isAuthenticated);
    showSuccess("Removed from cart.", { id: "cart.remove" });

    if (!isAuthenticated) {
      return true;
    }

    window.setTimeout(() => {
      void (async () => {
        try {
          if (target && zUuid(target.id)) {
            await cartService.removeItem(target.id);
            return;
          }
          if (target?.variantId) {
            const cart = await cartService.get();
            const serverLine = cart.items.find(
              (row) =>
                row.productId === target.productId &&
                row.variantId === target.variantId,
            );
            if (serverLine) {
              await cartService.removeItem(serverLine.id);
            }
          }
        } catch (error) {
          dispatch(setCartItems(previous));
          persistLocalCart(previous, true);
          showError(toApiError(error).message || "Could not remove item.", {
            id: "cart.remove.error",
          });
        }
      })();
    }, AUTH_CART_SYNC_DELAY_MS);

    return true;
  }

  async function clear(): Promise<boolean> {
    if (authLoading) return false;

    dispatch(clearCart());
    clearGuestCart();
    clearAccountCartCache();

    if (!isAuthenticated) {
      return true;
    }

    try {
      const cart = await cartService.clear();
      dispatch(
        setCartItems(cart.items.map((item) => mapAccountCartItemToCartItem(item))),
      );
      return true;
    } catch (error) {
      showError(toApiError(error).message || "Could not clear cart.", {
        id: "cart.clear.error",
      });
      return false;
    }
  }

  function setItemNote(itemId: string, note: string) {
    const trimmed = note.trim();
    const next = items.map((item) =>
      item.id === itemId ? { ...item, note: trimmed || undefined } : item,
    );
    dispatch(setCartItemNote({ id: itemId, note: trimmed }));
    persistLocalCart(next, isAuthenticated);
  }

  return {
    items,
    authLoading,
    add,
    setQuantity,
    setItemNote,
    remove,
    clear,
    readGuestCart,
    clearGuestCart,
  };
}
