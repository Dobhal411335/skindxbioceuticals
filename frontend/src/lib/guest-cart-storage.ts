import { z } from "zod";

/**
 * Guest cart persistence — product/variant IDs + quantities (+ optional display cache).
 * Never stores tokens or secrets. Prices in cache are display-only until login sync.
 */
export const GUEST_CART_STORAGE_KEY = "skindx.guest.cart.v1";
/** Logged-in cross-tab display cache — never fed into additive /cart/sync. */
export const ACCOUNT_CART_CACHE_KEY = "skindx.account.cart.cache.v1";

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
  categoryName: z.string().nullable().optional(),
  productCode: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  variantLabel: z.string().optional(),
  unitPriceInPaise: z.number().int().nonnegative().optional(),
  originalUnitPriceInPaise: z.number().int().nonnegative().optional(),
  discountCode: z.string().nullable().optional(),
  discountInPaise: z.number().int().nonnegative().optional(),
  cgstPercent: z.number().min(0).max(100).optional(),
  sgstPercent: z.number().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
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
  categoryName?: string | null;
  productCode?: string | null;
  imageUrl?: string | null;
  variantLabel?: string;
  unitPriceInPaise?: number;
  originalUnitPriceInPaise?: number;
  discountCode?: string | null;
  discountInPaise?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  note?: string;
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
    categoryName: asNullableString(record.categoryName) ?? null,
    productCode: asNullableString(record.productCode) ?? null,
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
    cgstPercent:
      typeof record.cgstPercent === "number"
        ? Math.min(100, Math.max(0, record.cgstPercent))
        : undefined,
    sgstPercent:
      typeof record.sgstPercent === "number"
        ? Math.min(100, Math.max(0, record.sgstPercent))
        : undefined,
    note:
      typeof record.note === "string"
        ? record.note.slice(0, 500)
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

function readCartBag(storageKey: string): GuestCartBag {
  if (!canUseStorage()) {
    return { version: 1, items: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
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

function writeCartBag(storageKey: string, items: GuestCartItem[]): boolean {
  if (!canUseStorage()) {
    return false;
  }

  const bag: GuestCartBag = {
    version: 1,
    items: sanitizeItems(items),
  };

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(bag));
    const verified = readCartBag(storageKey);
    return verified.items.length === bag.items.length;
  } catch {
    return false;
  }
}

export function readGuestCart(): GuestCartBag {
  return readCartBag(GUEST_CART_STORAGE_KEY);
}

export function writeGuestCart(items: GuestCartItem[]): boolean {
  return writeCartBag(GUEST_CART_STORAGE_KEY, items);
}

export function clearGuestCart(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

/** Instant paint for logged-in users across tabs (not used for guest→account additive sync). */
export function readAccountCartCache(): GuestCartBag {
  return readCartBag(ACCOUNT_CART_CACHE_KEY);
}

export function writeAccountCartCache(items: GuestCartItem[]): boolean {
  return writeCartBag(ACCOUNT_CART_CACHE_KEY, items);
}

export function clearAccountCartCache(): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCOUNT_CART_CACHE_KEY);
}

/** Prefer guest bag, else account cache — for first paint before auth finishes. */
export function readCartLocalPaint(): GuestCartBag {
  const guest = readGuestCart();
  if (guest.items.length > 0) return guest;
  return readAccountCartCache();
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
