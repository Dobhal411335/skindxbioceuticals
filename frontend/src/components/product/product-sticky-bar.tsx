"use client";

import Image from "next/image";
import { useMemo } from "react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import {
  availableColors,
  availableSizes,
  buildVariantSelectOptions,
  findExactVariant,
  findMatchingVariant,
  primaryImageUrl,
  rupeesToPaise,
} from "@/features/products/product-selection";
import { priceProductForRole } from "@/features/products/product-pricing";
import { useCartActions } from "@/hooks/useCartActions";
import { useIsVendor } from "@/hooks/useIsVendor";
import { showError } from "@/lib/toast";
import { formatInr } from "@/lib/utils";
import type { PublicProductDetail } from "@/types/product";
import { ShoppingCart } from "lucide-react";

type ProductStickyBarProps = {
  product: PublicProductDetail;
  sizeId: string | undefined;
  colorId: string | undefined;
  quantity: number;
  onSizeChange: (sizeId: string) => void;
  onColorChange: (colorId: string) => void;
  onQuantityChange: (quantity: number) => void;
};

export function ProductStickyBar({
  product,
  sizeId,
  colorId,
  quantity,
  onSizeChange,
  onColorChange,
  onQuantityChange,
}: ProductStickyBarProps) {
  const { add: addToCartAction } = useCartActions();
  const { openCart } = useCartUi();
  const isVendor = useIsVendor();

  const sizes = useMemo(() => availableSizes(product), [product]);
  const colors = useMemo(() => availableColors(product), [product]);
  const selectedSize = sizes.find((size) => size.id === sizeId) ?? sizes[0];
  const selectedColor =
    colors.find((color) => color.id === colorId) ?? colors[0];
  const selectedVariant =
    sizes.length === 0 && colors.length === 0
      ? findMatchingVariant(product, null, null)
      : findExactVariant(product, selectedSize?.label, selectedColor?.name);
  const availableQty = selectedVariant?.quantity ?? 0;
  const listPrice = selectedVariant?.price ?? 0;
  const priced = priceProductForRole({
    price: listPrice,
    vendorPrice: selectedVariant?.vendorPrice,
    isVendor,
    coupon: product.coupon,
  });
  const unitPrice = priced.unitPrice;
  const unavailable = !selectedVariant || availableQty <= 0;
  const imageUrl = primaryImageUrl(product);

  const options = useMemo(
    () => buildVariantSelectOptions(product),
    [product],
  );

  const selectedValue = useMemo(() => {
    if (colors.length > 0 && sizes.length > 0) {
      return `${selectedColor?.id ?? ""}::${selectedSize?.id ?? ""}`;
    }
    if (colors.length > 0) return selectedColor?.id ?? "";
    if (sizes.length > 0) return selectedSize?.id ?? "";
    return "";
  }, [colors.length, sizes.length, selectedColor?.id, selectedSize?.id]);

  function handleOptionChange(value: string) {
    if (!value) return;

    if (colors.length > 0 && sizes.length > 0) {
      const [nextColorId, nextSizeId] = value.split("::");
      if (nextColorId) onColorChange(nextColorId);
      if (nextSizeId) onSizeChange(nextSizeId);
      return;
    }

    if (colors.length > 0) {
      onColorChange(value);
      return;
    }

    if (sizes.length > 0) {
      onSizeChange(value);
    }
  }

  async function addToCart() {
    if (unavailable || !selectedVariant) {
      showError("Product not available right now.", { id: "cart.add.error" });
      return;
    }

    const ok = await addToCartAction({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      image: imageUrl,
      alt: product.name,
      productCode: product.productCode,
      variantLabel: [selectedColor?.name, selectedSize?.label]
        .filter(Boolean)
        .join(" / "),
      unitPriceInPaise: rupeesToPaise(unitPrice),
      originalUnitPriceInPaise: priced.hasDiscount
        ? rupeesToPaise(priced.originalPrice)
        : undefined,
      discountCode: priced.coupon?.code ?? null,
      discountInPaise: priced.hasDiscount
        ? rupeesToPaise(priced.discountAmount)
        : undefined,
      cgstPercent: product.tax?.cgst ?? 0,
      sgstPercent: product.tax?.sgst ?? 0,
      quantity,
    });
    if (ok) openCart();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-500 bg-background backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container-page flex w-full items-center gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {imageUrl ? (
            <div className="relative hidden size-16 shrink-0 overflow-hidden rounded bg-surface sm:block">
              <Image
                src={imageUrl ?? "https://placehold.co/64x64.png"}
                alt=""
                fill
                className="object-cover"
                sizes="52px"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-md font-semibold">{product.name}</p>
            <p className="text-md font-medium">
              {formatInr(unitPrice)}
              {priced.hasDiscount ? (
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  {formatInr(priced.originalPrice)}
                </span>
              ) : null}
            </p>
            {selectedColor || selectedSize ? (
              <p className="truncate text-xs text-muted-foreground">
                {[selectedColor?.name, selectedSize?.label]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            ) : null}
            {unavailable ? (
              <p className="text-xs font-medium text-destructive">
                Product not available right now.
              </p>
            ) : null}
          </div>
        </div>

        {options.length > 0 ? (
          <select
            aria-label="Colour and size"
            value={selectedValue}
            onChange={(event) => handleOptionChange(event.target.value)}
            className="h-10 max-w-[16rem] shrink-0 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.quantity <= 0}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : null}

        <QuantityStepper
          size="sm"
          className="shrink-0"
          value={quantity}
          onChange={onQuantityChange}
          min={1}
          max={Math.max(1, availableQty)}
        />
        <Button
          type="button"
          size="lg"
          className="h-11 shrink-0 px-10"
          disabled={unavailable}
          onClick={() => void addToCart()}
        >
          <ShoppingCart className="size-4 mr-2" /> Add to cart
        </Button>
      </div>
    </div>
  );
}
