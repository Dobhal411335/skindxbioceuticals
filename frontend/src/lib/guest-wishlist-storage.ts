import { z } from "zod";

/**
 * Guest wishlist persistence — product/variant IDs (+ optional display cache).
 * Never stores tokens or secrets.
 *
 * Reads/writes are resilient: a bad variantId or display field must never drop
 * a product line (that previously made items vanish after refresh).
 */
export const GUEST_WISHLIST_STORAGE_KEY = "skindx.guest.wishlist.v1";

function asNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value);
}

function asUuidOrNull(value: unknown): string | null {
  const asString = asNullableString(value);
  if (asString == null) return null;
  return z.string().uuid().safeParse(asString).success ? asString : null;
}

const guestWishlistCouponSchema = z.object({
  couponId: z.string().min(1),
  code: z.string().min(1),
  type: z.string().min(1),
  value: z.number(),
});

const guestWishlistItemSchema = z.object({
  // Prefer UUID products from the API, but keep any non-empty id so persist never silently no-ops.
  productId: z.string().min(1),
  variantId: z.string().uuid().nullable().optional(),
  productName: z.string().optional(),
  productSlug: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  available: z.boolean().optional(),
  coupon: guestWishlistCouponSchema.nullable().optional(),
});

const guestWishlistBagSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()).max(100),
});

export type GuestWishlistItem = {
  productId: string;
  variantId?: string | null;
  productName?: string;
  productSlug?: string;
  imageUrl?: string | null;
  price?: string | null;
  currency?: string | null;
  available?: boolean;
  coupon?: {
    couponId: string;
    code: string;
    type: string;
    value: number;
  } | null;
};

export type GuestWishlistBag = {
  version: 1;
  items: GuestWishlistItem[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeItem(raw: unknown): GuestWishlistItem | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const productId = asNullableString(record.productId);
  if (!productId) return null;

  const variantId = asUuidOrNull(record.variantId);
  const couponParsed = guestWishlistCouponSchema.safeParse(record.coupon);
  const candidate = {
    productId,
    variantId,
    productName:
      record.productName === undefined ? undefined : String(record.productName),
    productSlug:
      record.productSlug === undefined ? undefined : String(record.productSlug),
    imageUrl: asNullableString(record.imageUrl) ?? null,
    price: asNullableString(record.price) ?? null,
    currency: asNullableString(record.currency) ?? null,
    available:
      typeof record.available === "boolean" ? record.available : undefined,
    coupon:
      record.coupon === null
        ? null
        : couponParsed.success
          ? couponParsed.data
          : undefined,
  };

  const parsed = guestWishlistItemSchema.safeParse(candidate);
  if (!parsed.success) {
    // Last resort: keep the product id so refresh cannot drop the line.
    return { productId, variantId };
  }
  return {
    ...parsed.data,
    variantId: parsed.data.variantId ?? null,
  };
}

function sanitizeItems(rawItems: unknown[]): GuestWishlistItem[] {
  const seen = new Set<string>();
  const items: GuestWishlistItem[] = [];
  for (const raw of rawItems) {
    const item = sanitizeItem(raw);
    if (!item) continue;
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    items.push(item);
  }
  return items;
}

export function readGuestWishlist(): GuestWishlistBag {
  if (!canUseStorage()) {
    return { version: 1, items: [] };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    if (!raw) {
      return { version: 1, items: [] };
    }
    const parsed = guestWishlistBagSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { version: 1, items: [] };
    }
    return { version: 1, items: sanitizeItems(parsed.data.items) };
  } catch {
    return { version: 1, items: [] };
  }
}

export function writeGuestWishlist(items: GuestWishlistItem[]): boolean {
  if (!canUseStorage()) {
    return false;
  }

  const bag: GuestWishlistBag = {
    version: 1,
    items: sanitizeItems(items),
  };

  try {
    window.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(bag));
    // Verify round-trip so callers know refresh will see the same items.
    const verified = readGuestWishlist();
    return verified.items.length === bag.items.length;
  } catch {
    return false;
  }
}

export function clearGuestWishlist(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
}

export function toSyncPayload(bag: GuestWishlistBag): Array<{
  productId: string;
  variantId?: string | null;
}> {
  const seen = new Set<string>();
  const items: Array<{ productId: string; variantId?: string | null }> = [];
  for (const item of bag.items) {
    if (seen.has(item.productId)) continue;
    // Sync endpoint requires UUID product ids — skip non-uuid leftovers.
    if (!z.string().uuid().safeParse(item.productId).success) continue;
    seen.add(item.productId);
    items.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
    });
  }
  return items;
}
