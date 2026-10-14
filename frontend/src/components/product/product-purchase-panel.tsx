"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Ruler, Share2 } from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  applyProductCoupon,
  discountBannerText,
  formatWeightGrams,
  stockQtyBadgeClass,
} from "@/features/products/product-pricing";
import {
  availableColors,
  availableSizes,
  colorHasStock,
  findExactVariant,
  findMatchingVariant,
  firstCompatibleColor,
  firstCompatibleSize,
  isColorCompatibleWithSize,
  isSizeCompatibleWithColor,
  primaryImageUrl,
  rupeesToPaise,
  sizeHasStock,
} from "@/features/products/product-selection";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { plainTextForShare, shareContent } from "@/lib/share";
import { showError, showSuccess } from "@/lib/toast";
import { formatInr, cn } from "@/lib/utils";
import type { PublicProductDetail } from "@/types/product";

type ProductPurchasePanelProps = {
  product: PublicProductDetail;
  sizeId: string | undefined;
  colorId: string | undefined;
  quantity: number;
  onSizeChange: (sizeId: string) => void;
  onColorChange: (colorId: string) => void;
  onQuantityChange: (quantity: number) => void;
};

export function ProductPurchasePanel({
  product,
  sizeId,
  colorId,
  quantity,
  onSizeChange,
  onColorChange,
  onQuantityChange,
}: ProductPurchasePanelProps) {
  const { add: addToCartAction } = useCartActions();
  const router = useRouter();
  const { openCart } = useCartUi();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const [agreed, setAgreed] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const savedToWishlist = isInWishlist(product.id);

  const sizes = useMemo(() => availableSizes(product), [product]);
  const colors = useMemo(() => availableColors(product), [product]);

  const selectedColor =
    colors.find((color) => color.id === colorId) ?? colors[0];
  const selectedSize = sizes.find((size) => size.id === sizeId) ?? sizes[0];

  const selectedVariant = useMemo(() => {
    if (sizes.length === 0 && colors.length === 0) {
      return findMatchingVariant(product, null, null);
    }
    return findExactVariant(product, selectedSize?.label, selectedColor?.name);
  }, [
    product,
    sizes.length,
    colors.length,
    selectedSize?.label,
    selectedColor?.name,
  ]);

  const availableQty = selectedVariant?.quantity ?? 0;
  const listPrice = selectedVariant?.price ?? 0;
  const priced = useMemo(
    () => applyProductCoupon(listPrice, product.coupon),
    [listPrice, product.coupon],
  );
  const unitPrice = priced.unitPrice;
  const subtotal = unitPrice * quantity;
  const unavailable = !selectedVariant || availableQty <= 0;
  const discountLabel = discountBannerText(priced);
  const selectedWeightLabel = formatWeightGrams(selectedVariant?.weightGrams);

  useEffect(() => {
    if (availableQty > 0 && quantity > availableQty) {
      onQuantityChange(availableQty);
    }
  }, [availableQty, quantity, onQuantityChange]);

  function selectSize(nextSizeId: string) {
    const nextSize = sizes.find((size) => size.id === nextSizeId);
    if (!nextSize) return;

    onSizeChange(nextSizeId);

    if (
      selectedColor &&
      !isColorCompatibleWithSize(product, selectedColor.name, nextSize.label)
    ) {
      const nextColor = firstCompatibleColor(product, nextSize.label);
      if (nextColor) onColorChange(nextColor.id);
    }
  }

  function selectColor(nextColorId: string) {
    const nextColor = colors.find((color) => color.id === nextColorId);
    if (!nextColor) return;

    onColorChange(nextColorId);

    if (
      selectedSize &&
      !isSizeCompatibleWithColor(product, selectedSize.label, nextColor.name)
    ) {
      const nextSize = firstCompatibleSize(product, nextColor.name);
      if (nextSize) onSizeChange(nextSize.id);
    }
  }

  const variantLabel = [selectedColor?.name, selectedSize?.label]
    .filter(Boolean)
    .join(" / ");

  function requirePurchaseReady() {
    if (!agreed || unavailable || !selectedVariant) {
      showError(
        unavailable
          ? "Product not available right now."
          : "Please agree to the terms before adding to cart.",
        { id: "cart.add.error" },
      );
      return false;
    }
    return true;
  }

  function cartPayload(qty: number) {
    if (!selectedVariant) return null;
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      image: primaryImageUrl(product),
      alt: product.name,
      variantLabel,
      unitPriceInPaise: rupeesToPaise(unitPrice),
      originalUnitPriceInPaise: priced.hasDiscount
        ? rupeesToPaise(priced.originalPrice)
        : undefined,
      discountCode: priced.coupon?.code ?? null,
      discountInPaise: priced.hasDiscount
        ? rupeesToPaise(priced.discountAmount)
        : undefined,
      quantity: qty,
    };
  }

  async function addToCart() {
    if (!requirePurchaseReady() || !selectedVariant) return;
    const payload = cartPayload(quantity);
    if (!payload?.variantId) return;

    const ok = await addToCartAction({
      ...payload,
      variantId: payload.variantId,
    });
    if (ok) openCart();
  }

  async function buyNow() {
    if (!requirePurchaseReady() || !selectedVariant) return;
    const payload = cartPayload(quantity);
    if (!payload?.variantId) return;

    const ok = await addToCartAction({
      ...payload,
      variantId: payload.variantId,
    });
    if (!ok) {
      showError("Could not start checkout. Please try again.", {
        id: "cart.buynow.error",
      });
      return;
    }
    router.push("/checkout");
  }

  function scrollToReviews() {
    document
      .getElementById("product-reviews")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onWishlistToggle() {
    if (wishlistPending || wishlistAuthLoading) return;
    setWishlistPending(true);
    try {
      await toggleWishlist({
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        productName: product.name,
        productSlug: product.slug,
        imageUrl: primaryImageUrl(product) || null,
        price: selectedVariant ? String(selectedVariant.price) : null,
        currency: "INR",
        available: !unavailable,
      });
    } finally {
      setWishlistPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium tracking-wide text-foreground">
            {product.productCode}
          </span>
          {selectedVariant?.sku ? (
            <span className="text-xs text-muted-foreground">
              SKU:{" "}
              <span className="font-medium text-foreground">
                {selectedVariant.sku}
              </span>
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Availability:</span>
          <span className="font-medium">
            {unavailable ? "Out of stock" : "In stock"}
          </span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
              stockQtyBadgeClass(availableQty),
            )}
          >
            {availableQty} left
          </span>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold">{formatInr(unitPrice)}</p>
          {priced.hasDiscount ? (
            <p className="text-base text-muted-foreground line-through">
              {formatInr(priced.originalPrice)}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
        {discountLabel ? (
          <p className="mt-2 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            {discountLabel}
          </p>
        ) : null}
        {unavailable ? (
          <p className="mt-2 text-sm font-medium text-destructive">
            Product not available right now.
          </p>
        ) : null}
      </div>

      {product.reviewCount > 0 || product.averageRating > 0 ? (
        <button
          type="button"
          onClick={scrollToReviews}
          className="flex items-center gap-2 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Jump to customer reviews"
        >
          <ProductRatingStars
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
          />
          <span className="text-xs font-medium text-foreground underline underline-offset-2">
            Reviews
          </span>
        </button>
      ) : null}

      {product.description ? (
        <DescriptionPreview html={product.description} />
      ) : null}

      {colors.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Colour{selectedColor ? `: ${selectedColor.name}` : ""}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const hasStock = colorHasStock(product, color.name);
              const matchesSize = isColorCompatibleWithSize(
                product,
                color.name,
                selectedSize?.label,
              );
              const pairVariant = findExactVariant(
                product,
                matchesSize ? selectedSize?.label : firstCompatibleSize(product, color.name)?.label,
                color.name,
              );
              const colorPrice = pairVariant?.price;
              return (
                <button
                  key={color.id}
                  type="button"
                  aria-label={
                    colorPrice != null
                      ? `${color.name}, ${formatInr(colorPrice)}`
                      : color.name
                  }
                  aria-pressed={colorId === color.id}
                  disabled={!hasStock}
                  title={
                    colorPrice != null
                      ? `${color.name} — ${formatInr(colorPrice)}`
                      : color.name
                  }
                  className={cn(
                    "size-9 rounded-full border border-border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    colorId === color.id && "ring-2 ring-foreground ring-offset-2",
                    !matchesSize && hasStock && "opacity-35",
                    !hasStock && "cursor-not-allowed opacity-25",
                  )}
                  style={{ backgroundColor: color.hex ?? "#d4d4d4" }}
                  onClick={() => hasStock && selectColor(color.id)}
                />
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {sizes.length === 0 && selectedWeightLabel ? (
        <p className="inline-flex rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm font-medium">
          {selectedWeightLabel}
        </p>
      ) : null}

      {sizes.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Size
            {selectedSize
              ? `: ${
                  selectedWeightLabel
                    ? `${selectedSize.label} | ${selectedWeightLabel}`
                    : selectedSize.label
                }`
              : ""}
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const hasStock = sizeHasStock(product, size.label);
              const matchesColor = isSizeCompatibleWithColor(
                product,
                size.label,
                selectedColor?.name,
              );
              const pairVariant = findExactVariant(
                product,
                size.label,
                matchesColor
                  ? selectedColor?.name
                  : firstCompatibleColor(product, size.label)?.name,
              );
              const sizePrice = pairVariant?.price;
              const weightLabel = formatWeightGrams(pairVariant?.weightGrams);
              const sizeDisplay = weightLabel
                ? `${size.label} | ${weightLabel}`
                : size.label;
              return (
                <button
                  key={size.id}
                  type="button"
                  disabled={!hasStock}
                  aria-pressed={sizeId === size.id}
                  title={
                    sizePrice != null
                      ? `${sizeDisplay} — ${formatInr(sizePrice)}`
                      : sizeDisplay
                  }
                  className={cn(
                    "flex min-w-11 flex-col items-center justify-center rounded-sm border px-2 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    sizeId === size.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background",
                    !matchesColor && hasStock && "opacity-40",
                    !hasStock && "cursor-not-allowed opacity-30 line-through",
                  )}
                  onClick={() => hasStock && selectSize(size.id)}
                >
                  <span>{sizeDisplay}</span>
                  {hasStock && sizePrice != null ? (
                    <span
                      className={cn(
                        "text-[10px] font-normal",
                        sizeId === size.id
                          ? "text-background/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatInr(sizePrice)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={quantity}
          onChange={onQuantityChange}
          min={1}
          max={Math.max(1, availableQty)}
        />
        <p className="text-sm">
          Subtotal: <span className="font-semibold">{formatInr(subtotal)}</span>
        </p>
      </div>

      {product.sizeChart?.url ? (
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            onClick={() => setSizeGuideOpen(true)}
          >
            <Ruler className="size-4" aria-hidden />
            Size guide
          </button>
          <SizeGuideDialog
            open={sizeGuideOpen}
            onOpenChange={setSizeGuideOpen}
            imageUrl={product.sizeChart.url}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          className="h-11 flex-1"
          disabled={!agreed || unavailable}
          onClick={() => void addToCart()}
        >
          Add to cart
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11"
          aria-label={savedToWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={savedToWishlist}
          disabled={wishlistPending || wishlistAuthLoading}
          onClick={() => void onWishlistToggle()}
        >
          <Heart
            className={cn("size-5", savedToWishlist && "fill-current text-primary")}
          />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11"
          aria-label="Share product"
          onClick={() =>
            void shareContent({
              title: product.name,
              text:
                plainTextForShare(product.description) || product.name,
              url: `/products/${product.slug}`,
              toastId: "product.share",
              errorMessage: "Could not share this product.",
            })
          }
        >
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
          I agree with{" "}
          <Link href="/policies/terms" className="underline underline-offset-2">
            Terms &amp; Conditions
          </Link>
        </Label>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full"
        disabled={!agreed || unavailable}
        onClick={() => void buyNow()}
      >
        Buy it now
      </Button>
    </div>
  );
}

function DescriptionPreview({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpanded(false);
    setNeedsToggle(true);

    const frame = window.requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      setNeedsToggle(el.scrollHeight > el.clientHeight + 2);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [html]);

  return (
    <div>
      <div
        ref={ref}
        className={cn(
          "rich-html text-sm text-muted-foreground",
          !expanded && "line-clamp-4",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needsToggle || expanded ? (
        <button
          type="button"
          className="mt-1.5 text-xs font-medium text-foreground underline underline-offset-2"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

function SizeGuideDialog({
  open,
  onOpenChange,
  imageUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Size guide</DialogTitle>
          <DialogDescription>
            Use this chart to choose the right size.
          </DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-md border border-border bg-surface">
          <Image
            src={imageUrl}
            alt="Size guide"
            width={800}
            height={600}
            className="h-auto w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
