"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Ruler, Share2 } from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CatalogProduct } from "@/data/catalog";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showSuccess } from "@/lib/toast";
import { formatPaiseToInr, cn } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";

type ProductPurchasePanelProps = {
  product: CatalogProduct;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const defaultSize =
    product.sizes.find((size) => size.available)?.id ?? product.sizes[0]?.id;
  const [colorId, setColorId] = useState(product.colors[0]?.id);
  const [sizeId, setSizeId] = useState(defaultSize);
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed] = useState(false);

  const selectedColor = product.colors.find((color) => color.id === colorId);
  const selectedSize = product.sizes.find((size) => size.id === sizeId);

  const subtotal = useMemo(
    () => product.priceInPaise * quantity,
    [product.priceInPaise, quantity],
  );

  const variantLabel = [selectedColor?.label, selectedSize?.label]
    .filter(Boolean)
    .join(" / ");

  function addToCart() {
    if (!agreed || product.availability !== "in_stock") return;
    dispatch(
      addCartItem({
        productId: product.id,
        variantId: `${colorId ?? "default"}-${sizeId ?? "default"}`,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? "",
        alt: product.images[0]?.alt ?? product.name,
        variantLabel,
        unitPriceInPaise: product.priceInPaise,
        quantity,
      }),
    );
    showSuccess("Added to cart.", { id: "cart.add" });
    openCart();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {product.shortDescription}
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Version</dt>
          <dd className="font-medium">{product.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">SKU</dt>
          <dd className="font-medium">{product.sku}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Availability</dt>
          <dd className="font-medium">
            {product.availability === "in_stock" ? "In stock" : "Out of stock"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Product type</dt>
          <dd className="font-medium">{product.productType}</dd>
        </div>
      </dl>

      <div>
        <p className="text-2xl font-semibold">
          {formatPaiseToInr(product.priceInPaise)}
        </p>
        <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
      </div>

      {product.colors.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Colour{selectedColor ? `: ${selectedColor.label}` : ""}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-label={color.label}
                aria-pressed={colorId === color.id}
                className={cn(
                  "size-8 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  colorId === color.id ? "border-foreground" : "border-transparent",
                )}
                style={{ backgroundColor: color.hex }}
                onClick={() => setColorId(color.id)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {product.sizes.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Size{selectedSize ? `: ${selectedSize.label}` : ""}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                type="button"
                disabled={!size.available}
                aria-pressed={sizeId === size.id}
                className={cn(
                  "min-w-12 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  sizeId === size.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background",
                  !size.available &&
                    "cursor-not-allowed opacity-40 line-through",
                )}
                onClick={() => size.available && setSizeId(size.id)}
              >
                {size.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <p className="text-sm">
          Subtotal:{" "}
          <span className="font-semibold">{formatPaiseToInr(subtotal)}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Ruler className="size-4" aria-hidden />
          Size guide
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          Compare options
        </button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={!agreed || product.availability !== "in_stock"}
          onClick={addToCart}
        >
          Add to cart
        </Button>
        <Button type="button" variant="outline" size="icon-lg" aria-label="Wishlist">
          <Heart className="size-5" />
        </Button>
        <Button type="button" variant="outline" size="icon-lg" aria-label="Share">
          <Share2 className="size-5" />
        </Button>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="pdp-terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
        />
        <Label htmlFor="pdp-terms" className="text-xs leading-snug font-normal">
          I agree with Terms &amp; Conditions
        </Label>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full">
        <Link href={agreed ? "/checkout" : "#"}>Buy it now</Link>
      </Button>
    </div>
  );
}
