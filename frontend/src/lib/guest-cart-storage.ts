import { z } from "zod";

/**
 * Guest cart persistence — product/variant IDs + quantities (+ optional display cache).
 * Never stores tokens or secrets. Prices in cache are display-only until login sync.
 */
export const GUEST_CART_STORAGE_KEY = "skindx.guest.cart.v1";

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

const guestCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  productName: z.string().optional(),
  productSlug: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  variantLabel: z.string().optional(),
  unitPriceInPaise: z.number().int().nonnegative().optional(),
  originalUnitPriceInPaise: z.number().int().nonnegative().optional(),
  discountCode: z.string().nullable().optional(),
  discountInPaise: z.number().int().nonnegative().optional(),
});

const guestCartBagSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()).max(100),
});

export type GuestCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  productName?: string;
  productSlug?: string;
  imageUrl?: string | null;
  variantLabel?: string;
  unitPriceInPaise?: number;
  originalUnitPriceInPaise?: number;
  discountCode?: string | null;
  discountInPaise?: number;
};

export type GuestCartBag = {
  version: 1;
  items: GuestCartItem[];
};

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function sanitizeItem(raw: unknown): GuestCartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const productId = asUuidOrNull(record.productId);
  const variantId = asUuidOrNull(record.variantId);
  if (!productId || !variantId) return null;

  const quantityRaw = Number(record.quantity);
  const quantity =
    Number.isFinite(quantityRaw) && quantityRaw >= 1
      ? Math.min(99, Math.floor(quantityRaw))
      : 1;

  const candidate = {
    productId,
    variantId,
    quantity,
    productName:
      record.productName === undefined ? undefined : String(record.productName),
    productSlug:
      record.productSlug === undefined ? undefined : String(record.productSlug),
    imageUrl: asNullableString(record.imageUrl) ?? null,
    variantLabel:
      record.variantLabel === undefined
        ? undefined
        : String(record.variantLabel),
    unitPriceInPaise:
      typeof record.unitPriceInPaise === "number"
        ? Math.max(0, Math.round(record.unitPriceInPaise))
        : undefined,
    originalUnitPriceInPaise:
      typeof record.originalUnitPriceInPaise === "number"
        ? Math.max(0, Math.round(record.originalUnitPriceInPaise))
        : undefined,
    discountCode: asNullableString(record.discountCode) ?? null,
    discountInPaise:
      typeof record.discountInPaise === "number"
        ? Math.max(0, Math.round(record.discountInPaise))
        : undefined,
  };

  const parsed = guestCartItemSchema.safeParse(candidate);
  if (!parsed.success) {
    return { productId, variantId, quantity };
  }
  return parsed.data;
}

function sanitizeItems(rawItems: unknown[]): GuestCartItem[] {
  const seen = new Map<string, GuestCartItem>();
  for (const raw of rawItems) {
    const item = sanitizeItem(raw);
    if (!item) continue;
    const key = `${item.productId}:${item.variantId}`;
    const prev = seen.get(key);
    if (prev) {
      seen.set(key, {
        ...prev,
        ...item,
        quantity: Math.min(99, prev.quantity + item.quantity),
      });
    } else {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

export function readGuestCart(): GuestCartBag {
  if (!canUseStorage()) {
    return { version: 1, items: [] };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) {
      return { version: 1, items: [] };
    }
    const parsed = guestCartBagSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { version: 1, items: [] };
    }
    return { version: 1, items: sanitizeItems(parsed.data.items) };
  } catch {
    return { version: 1, items: [] };
  }
}

export function writeGuestCart(items: GuestCartItem[]): boolean {
  if (!canUseStorage()) {
    return false;
  }

  const bag: GuestCartBag = {
    version: 1,
    items: sanitizeItems(items),
  };

  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(bag));
    const verified = readGuestCart();
    return verified.items.length === bag.items.length;
  } catch {
    return false;
  }
}

export function clearGuestCart(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

export function toCartSyncPayload(bag: GuestCartBag): Array<{
  productId: string;
  variantId: string;
  quantity: number;
}> {
  return bag.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));
}
