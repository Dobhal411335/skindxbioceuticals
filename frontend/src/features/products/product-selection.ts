import type {
  PublicProductColor,
  PublicProductDetail,
  PublicProductSize,
  PublicProductVariant,
} from "@/types/product";

/** Convert API INR rupees to cart paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function activeVariants(
  product: PublicProductDetail,
): PublicProductVariant[] {
  return product.variants.filter((variant) => variant.isActive);
}

/** Exact active variant for a size/color pair — no fallback. */
export function findExactVariant(
  product: PublicProductDetail,
  sizeLabel: string | null | undefined,
  colorLabel: string | null | undefined,
): PublicProductVariant | undefined {
  return activeVariants(product).find((variant) => {
    const sizeOk = sizeLabel
      ? variant.sizeLabel === sizeLabel
      : !variant.sizeLabel;
    const colorOk = colorLabel
      ? variant.colorLabel === colorLabel
      : !variant.colorLabel;
    return sizeOk && colorOk;
  });
}

/**
 * Prefer an exact size+color match. Falls back to the first active variant
 * only when no selection has been made yet.
 */
export function findMatchingVariant(
  product: PublicProductDetail,
  sizeLabel: string | null | undefined,
  colorLabel: string | null | undefined,
): PublicProductVariant | undefined {
  const variants = activeVariants(product);
  if (variants.length === 0) return undefined;

  const exact = findExactVariant(product, sizeLabel, colorLabel);
  if (exact) return exact;

  if (!sizeLabel && !colorLabel) return variants[0];
  return undefined;
}

/** Sizes that appear on at least one active variant. */
export function availableSizes(
  product: PublicProductDetail,
): PublicProductSize[] {
  const labels = new Set(
    activeVariants(product)
      .map((variant) => variant.sizeLabel)
      .filter((label): label is string => Boolean(label)),
  );
  if (labels.size === 0) return [];
  return product.sizes.filter((size) => labels.has(size.label));
}

/** Colours that appear on at least one active variant. */
export function availableColors(
  product: PublicProductDetail,
): PublicProductColor[] {
  const names = new Set(
    activeVariants(product)
      .map((variant) => variant.colorLabel)
      .filter((name): name is string => Boolean(name)),
  );
  if (names.size === 0) return [];
  return product.colors.filter((color) => names.has(color.name));
}

/** True when this size exists on any in-stock active variant. */
export function sizeHasStock(
  product: PublicProductDetail,
  sizeLabel: string,
): boolean {
  return activeVariants(product).some(
    (variant) => variant.sizeLabel === sizeLabel && variant.quantity > 0,
  );
}

/** True when this colour exists on any in-stock active variant. */
export function colorHasStock(
  product: PublicProductDetail,
  colorLabel: string,
): boolean {
  return activeVariants(product).some(
    (variant) => variant.colorLabel === colorLabel && variant.quantity > 0,
  );
}

/** True when this size+colour pair is an in-stock active variant. */
export function isSizeCompatibleWithColor(
  product: PublicProductDetail,
  sizeLabel: string,
  colorLabel: string | null | undefined,
): boolean {
  if (!colorLabel) return sizeHasStock(product, sizeLabel);
  const variant = findExactVariant(product, sizeLabel, colorLabel);
  return (variant?.quantity ?? 0) > 0;
}

/** True when this colour+size pair is an in-stock active variant. */
export function isColorCompatibleWithSize(
  product: PublicProductDetail,
  colorLabel: string,
  sizeLabel: string | null | undefined,
): boolean {
  if (!sizeLabel) return colorHasStock(product, colorLabel);
  const variant = findExactVariant(product, sizeLabel, colorLabel);
  return (variant?.quantity ?? 0) > 0;
}

/** First in-stock colour that works with the given size. */
export function firstCompatibleColor(
  product: PublicProductDetail,
  sizeLabel: string,
): PublicProductColor | undefined {
  return availableColors(product).find((color) =>
    isColorCompatibleWithSize(product, color.name, sizeLabel),
  );
}

/** First in-stock size that works with the given colour. */
export function firstCompatibleSize(
  product: PublicProductDetail,
  colorLabel: string,
): PublicProductSize | undefined {
  return availableSizes(product).find((size) =>
    isSizeCompatibleWithColor(product, size.label, colorLabel),
  );
}

export function defaultSize(product: PublicProductDetail): PublicProductSize | undefined {
  const sizes = availableSizes(product);
  const fromVariant = activeVariants(product).find(
    (variant) => variant.sizeLabel && variant.quantity > 0,
  )?.sizeLabel;
  if (fromVariant) {
    return sizes.find((size) => size.label === fromVariant) ?? sizes[0];
  }
  return sizes[0];
}

export function defaultColor(
  product: PublicProductDetail,
): PublicProductColor | undefined {
  const colors = availableColors(product);
  const size = defaultSize(product);
  if (size) {
    const matched = firstCompatibleColor(product, size.label);
    if (matched) return matched;
  }
  const fromVariant = activeVariants(product).find(
    (variant) => variant.colorLabel && variant.quantity > 0,
  )?.colorLabel;
  if (fromVariant) {
    return colors.find((color) => color.name === fromVariant) ?? colors[0];
  }
  return colors[0];
}

export function primaryImageUrl(product: PublicProductDetail): string {
  return (
    product.gallery.find((image) => image.isPrimary)?.imageUrl ??
    product.gallery[0]?.imageUrl ??
    product.banner?.url ??
    ""
  );
}

export type VariantSelectOption = {
  value: string;
  label: string;
  sizeId?: string;
  colorId?: string;
  price: number;
  quantity: number;
};

/** Native-select options for real active variant combinations only. */
export function buildVariantSelectOptions(
  product: PublicProductDetail,
): VariantSelectOption[] {
  const colors = availableColors(product);
  const sizes = availableSizes(product);
  const variants = activeVariants(product);

  if (colors.length > 0 && sizes.length > 0) {
    return variants
      .map((variant) => {
        const color = colors.find((item) => item.name === variant.colorLabel);
        const size = sizes.find((item) => item.label === variant.sizeLabel);
        if (!color || !size) return null;
        return {
          value: `${color.id}::${size.id}`,
          label: `${color.name} / ${size.label} — ₹${variant.price}`,
          colorId: color.id,
          sizeId: size.id,
          price: variant.price,
          quantity: variant.quantity,
        };
      })
      .filter((option): option is VariantSelectOption => option !== null);
  }

  if (colors.length > 0) {
    return variants
      .map((variant) => {
        const color = colors.find((item) => item.name === variant.colorLabel);
        if (!color) return null;
        return {
          value: color.id,
          label: `${color.name} — ₹${variant.price}`,
          colorId: color.id,
          price: variant.price,
          quantity: variant.quantity,
        };
      })
      .filter((option): option is VariantSelectOption => option !== null);
  }

  if (sizes.length > 0) {
    return variants
      .map((variant) => {
        const size = sizes.find((item) => item.label === variant.sizeLabel);
        if (!size) return null;
        return {
          value: size.id,
          label: `${size.label} — ₹${variant.price}`,
          sizeId: size.id,
          price: variant.price,
          quantity: variant.quantity,
        };
      })
      .filter((option): option is VariantSelectOption => option !== null);
  }

  // No size/color options — storefront shows price only (no selector).
  return [];
}
