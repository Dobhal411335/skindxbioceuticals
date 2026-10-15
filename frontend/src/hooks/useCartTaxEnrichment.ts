"use client";

import { useEffect, useState } from "react";

import { cartService } from "@/features/cart/cart.service";
import { mapAccountCartItemToCartItem } from "@/features/cart/map-account-cart-item";
import { fetchProductBySlugClient } from "@/features/products/product.service";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import {
  writeAccountCartCache,
  writeGuestCart,
  type GuestCartItem,
} from "@/lib/guest-cart-storage";
import type { CartItem } from "@/types/cart";
import { setCartItems } from "@/store/slices/cartSlice";

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

function persistEnrichedCart(items: CartItem[], authenticated: boolean) {
  const bag = items
    .map(toGuestBagItem)
    .filter((item): item is GuestCartItem => item != null);
  if (authenticated) {
    writeAccountCartCache(bag);
  } else {
    writeGuestCart(bag);
  }
}

/**
 * Backfill CGST/SGST (and productCode) when cart lines were saved without
 * product tax rates. Safe to call from cart page and checkout.
 */
export function useCartTaxEnrichment(
  items: CartItem[],
  options: { enabled: boolean },
) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const [taxRefreshDone, setTaxRefreshDone] = useState(false);

  useEffect(() => {
    setTaxRefreshDone(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!options.enabled || items.length === 0 || taxRefreshDone) return;

    let cancelled = false;

    void (async () => {
      let working = items;

      if (isAuthenticated) {
        try {
          const cart = await cartService.get();
          if (cancelled) return;
          const mapped = cart.items.map((item) =>
            mapAccountCartItemToCartItem(item),
          );
          const byKey = new Map(
            mapped.map((item) => [
              `${item.productId}:${item.variantId ?? "default"}`,
              item,
            ]),
          );
          working = items.map((local) => {
            const key = `${local.productId}:${local.variantId ?? "default"}`;
            const server = byKey.get(key);
            if (!server) return local;
            return {
              ...local,
              ...server,
              image: server.image || local.image,
              note: local.note,
            };
          });
        } catch {
          // Guest-style PDP fill below.
        }
      }

      const needsTax = working.filter(
        (item) =>
          Boolean(item.slug) &&
          (item.cgstPercent ?? 0) === 0 &&
          (item.sgstPercent ?? 0) === 0,
      );

      if (needsTax.length > 0) {
        const patchByProductId = new Map<
          string,
          {
            cgstPercent: number;
            sgstPercent: number;
            productCode: string | null;
          }
        >();

        await Promise.all(
          needsTax.map(async (item) => {
            const detail = await fetchProductBySlugClient(item.slug);
            if (!detail?.tax) return;
            patchByProductId.set(item.productId, {
              cgstPercent: detail.tax.cgst ?? 0,
              sgstPercent: detail.tax.sgst ?? 0,
              productCode: detail.productCode || null,
            });
          }),
        );

        if (cancelled) return;

        if (patchByProductId.size > 0) {
          working = working.map((item) => {
            const patch = patchByProductId.get(item.productId);
            if (!patch) return item;
            return {
              ...item,
              cgstPercent: patch.cgstPercent,
              sgstPercent: patch.sgstPercent,
              productCode: item.productCode || patch.productCode,
            };
          });
        }
      }

      if (cancelled) return;

      const changed =
        working.length !== items.length ||
        working.some((item, index) => {
          const prev = items[index];
          if (!prev || prev.id !== item.id) return true;
          return (
            (prev.cgstPercent ?? 0) !== (item.cgstPercent ?? 0) ||
            (prev.sgstPercent ?? 0) !== (item.sgstPercent ?? 0) ||
            prev.productCode !== item.productCode ||
            prev.categoryName !== item.categoryName
          );
        });

      if (changed) {
        dispatch(setCartItems(working));
        persistEnrichedCart(working, isAuthenticated);
      }
      setTaxRefreshDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated, items, options.enabled, taxRefreshDone]);
}
