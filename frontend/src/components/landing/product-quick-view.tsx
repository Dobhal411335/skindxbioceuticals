"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";

import {
  ProductDiscountBadge,
  ProductPriceDisplay,
} from "@/components/catalog/product-price-display";
import { ProductRatingStars } from "@/components/landing/product-rating-stars";
import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductBySlugClient } from "@/features/products/product.service";
import {
  buildCartPricingFields,
  discountPercentForBadge,
  priceProductForRole,
} from "@/features/products/product-pricing";
import { useIsVendor } from "@/hooks/useIsVendor";
import {
  availableColors,
  availableSizes,
  colorHasStock,
  defaultColor,
  defaultSize,
  findExactVariant,
  findMatchingVariant,
  firstCompatibleColor,
  firstCompatibleSize,
  isColorCompatibleWithSize,
  isSizeCompatibleWithColor,
  primaryImageUrl,
  sizeHasStock,
} from "@/features/products/product-selection";
import { useCartActions } from "@/hooks/useCartActions";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { showError } from "@/lib/toast";
import { cn, formatInr } from "@/lib/utils";
import type { PublicProductDetail } from "@/types/product";

type ProductQuickViewProps = {
  slug: string | null;
  categoryName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
          "rich-html font-sans text-sm text-muted-foreground",
          !expanded && "line-clamp-7",
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

function QuickViewSkeleton() {
  return (
    <div
      className="grid gap-6 md:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <div className="md:hidden">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
        <div className="hidden space-y-3 md:block">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-14 rounded-sm" />
          <Skeleton className="h-11 w-14 rounded-sm" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 flex-1 rounded-md" />
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-5 w-36" />
      </div>
      <span className="sr-only">Loading product details</span>
    </div>
  );
}

const IMAGE_FRAME =
  "relative h-[350px] w-[350px] overflow-hidden rounded-lg bg-surface";

function ImageStack({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  if (images.length === 0) {
    return (
      <div
        className={cn(
          IMAGE_FRAME,
          "flex items-center justify-center text-sm text-muted-foreground",
        )}
      >
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {images.map((src, index) => (
        <div key={`${src}-${index}`} className={IMAGE_FRAME}>
          <Image
            src={src}
            alt={`${productName} image ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 420px"
          />
        </div>
      ))}
    </div>
  );
}

function ImageCarousel({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  if (images.length === 0) {
    return (
      <div
        className={cn(
          IMAGE_FRAME,
          "flex items-center justify-center text-sm text-muted-foreground",
        )}
      >
        No image
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={IMAGE_FRAME}>
        <Image
          src={images[0]!}
          alt={productName}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={`${src}-${index}`}>
            <div className={IMAGE_FRAME}>
              <Image
                src={src}
                alt={`${productName} image ${index + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}

export function ProductQuickView({
  slug,
  categoryName,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  const router = useRouter();
  const { openCart } = useCartUi();
  const { add: addToCartAction } = useCartActions();
  const {
    toggle: toggleWishlist,
    isInWishlist,
    authLoading: wishlistAuthLoading,
  } = useWishlistActions();
  const isVendor = useIsVendor();
  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [sizeLabel, setSizeLabel] = useState<string | null>(null);
  const [colorLabel, setColorLabel] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlistPending, setWishlistPending] = useState(false);

  useEffect(() => {
    if (!open || !slug) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setQuantity(1);

    void fetchProductBySlugClient(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        if (data) {
          const size = defaultSize(data);
          const color = size
            ? firstCompatibleColor(data, size.label) ?? defaultColor(data)
            : defaultColor(data);
          setSizeLabel(size?.label ?? null);
          setColorLabel(color?.name ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  const sizes = useMemo(
    () => (product ? availableSizes(product) : []),
    [product],
  );
  const colors = useMemo(
    () => (product ? availableColors(product) : []),
    [product],
  );
  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    if (sizes.length === 0 && colors.length === 0) {
      return findMatchingVariant(product, null, null);
    }
    return findMatchingVariant(product, sizeLabel, colorLabel);
  }, [product, sizes.length, colors.length, sizeLabel, colorLabel]);

  const images = useMemo(() => {
    if (!product) return [];
    if (product.gallery.length > 0) {
      return product.gallery.map((image) => image.imageUrl);
    }
    const fallback = primaryImageUrl(product);
    return fallback ? [fallback] : [];
  }, [product]);

  const maxQty = selectedVariant?.quantity ?? 0;
  const listPrice =
    selectedVariant?.price ?? product?.variants[0]?.price ?? 0;
  const vendorPrice =
    selectedVariant?.vendorPrice ?? product?.variants[0]?.vendorPrice ?? null;
  const priced = priceProductForRole({
    price: listPrice,
    vendorPrice,
    isVendor,
    coupon: product?.coupon ?? null,
  });
  const discountPercent = discountPercentForBadge(priced);
  const inStock = Boolean(selectedVariant && maxQty > 0);
  const inWishlist = product ? isInWishlist(product.id) : false;
  const canPurchase = Boolean(selectedVariant && maxQty > 0);

  function clampQty(next: number) {
    if (maxQty <= 0) return 1;
    return Math.min(maxQty, Math.max(1, next));
  }

  function selectSize(nextLabel: string) {
    if (!product) return;
    setSizeLabel(nextLabel);
    if (colorLabel) {
      const ok = findExactVariant(product, nextLabel, colorLabel);
      if (!ok) {
        setColorLabel(firstCompatibleColor(product, nextLabel)?.name ?? null);
      }
    }
    setQuantity(1);
  }

  function selectColor(nextName: string) {
    if (!product) return;
    setColorLabel(nextName);
    if (sizeLabel) {
      const ok = findExactVariant(product, sizeLabel, nextName);
      if (!ok) {
        setSizeLabel(firstCompatibleSize(product, nextName)?.label ?? null);
      }
    }
    setQuantity(1);
  }

  function requirePurchaseReady() {
    if (!product || !selectedVariant) {
      showError("Select an available option before continuing.", {
        id: "quickview.cart.error",
      });
      return false;
    }
    if (selectedVariant.quantity <= 0) {
      showError("This option is out of stock.", { id: "quickview.cart.error" });
      return false;
    }
    return true;
  }

  function buildCartPayload() {
    if (!product || !selectedVariant) return null;
    const pricing = buildCartPricingFields(
      selectedVariant.price,
      product.coupon,
      {
        isVendor,
        vendorPrice: selectedVariant.vendorPrice,
        b2cPrice: selectedVariant.price,
      },
    );
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      image: images[0] ?? primaryImageUrl(product) ?? "",
      alt: product.name,
      productCode: product.productCode,
      categoryName: categoryName ?? null,
      variantLabel: selectedVariant.name,
      unitPriceInPaise: pricing.unitPriceInPaise,
      originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
      discountCode: pricing.discountCode,
      discountInPaise: pricing.discountInPaise,
      cgstPercent: product.tax?.cgst ?? 0,
      sgstPercent: product.tax?.sgst ?? 0,
      quantity: clampQty(quantity),
    };
  }

  async function addToCart() {
    if (!requirePurchaseReady()) return;
    const payload = buildCartPayload();
    if (!payload) return;

    const ok = await addToCartAction(payload);
    if (!ok) return;
    onOpenChange(false);
    openCart();
  }

  async function buyNow() {
    if (!requirePurchaseReady()) return;
    const payload = buildCartPayload();
    if (!payload) return;

    const ok = await addToCartAction(payload);
    if (!ok) {
      showError("Could not start checkout. Please try again.", {
        id: "quickview.buynow.error",
      });
      return;
    }
    onOpenChange(false);
    router.push("/checkout");
  }

  async function onWishlist() {
    if (!product || wishlistPending || wishlistAuthLoading) return;
    setWishlistPending(true);
    try {
      await toggleWishlist({
        productId: product.id,
        variantId: selectedVariant?.id ?? product.variants[0]?.id ?? null,
        productName: product.name,
        productSlug: product.slug,
        productCode: product.productCode,
        categoryName: categoryName ?? null,
        imageUrl: images[0] ?? primaryImageUrl(product),
        price: String(listPrice),
        currency: "INR",
        available: inStock,
        cgstPercent: product.tax?.cgst ?? 0,
        sgstPercent: product.tax?.sgst ?? 0,
        coupon: product.coupon,
      });
    } finally {
      setWishlistPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0",
          "data-[side=right]:w-[min(100vw,52rem)] data-[side=right]:sm:max-w-[min(96vw,52rem)]",
          "sm:max-w-[min(96vw,52rem)]",
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 pr-12 md:px-6">
          <SheetTitle className="text-left text-lg font-semibold">
            Quick view
          </SheetTitle>
          <SheetDescription className="sr-only">
            Product quick look details
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full overflow-y-auto px-4 py-5 scrollbar-thin md:px-6">
              <QuickViewSkeleton />
            </div>
          ) : !product ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">
              Product unavailable.
            </p>
          ) : (
            <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-0">
              <div
                className={cn(
                  "shrink-0 border-b border-border px-4 py-4 md:h-full md:min-h-0 md:overflow-y-auto md:border-b-0 md:border-r md:px-5 md:py-5",
                  "scrollbar-thin",
                )}
              >
                <div className="md:hidden">
                  <ImageCarousel images={images} productName={product.name} />
                </div>
                <div className="hidden md:block">
                  <ImageStack images={images} productName={product.name} />
                </div>
              </div>

              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 md:h-full md:px-6",
                  "scrollbar-thin",
                )}
              >
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                    {categoryName ?? "Product"}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                    {product.name}
                  </h3>
                  <div className="mt-2">
                    <ProductRatingStars
                      averageRating={product.averageRating}
                      reviewCount={product.reviewCount}
                      className="text-foreground"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ProductPriceDisplay
                    price={listPrice}
                    vendorPrice={vendorPrice}
                    isVendor={isVendor}
                    dualLabeled={isVendor}
                    coupon={product.coupon}
                    priced={priced}
                    showBadge={false}
                    size="lg"
                    className="text-2xl [&_span:first-child]:text-2xl"
                  />
                  {!isVendor && discountPercent != null ? (
                    <ProductDiscountBadge percent={discountPercent} />
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
                      inStock
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {inStock ? "In stock" : "Out of stock"}
                  </span>
                </div>

                {product.description ? (
                  <DescriptionPreview html={product.description} />
                ) : null}

                {colors.length > 0 ? (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">
                      Colour{colorLabel ? `: ${colorLabel}` : ""}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => {
                        const hasStock = colorHasStock(product, color.name);
                        const matchesSize = isColorCompatibleWithSize(
                          product,
                          color.name,
                          sizeLabel,
                        );
                        const pairVariant = findExactVariant(
                          product,
                          matchesSize
                            ? sizeLabel
                            : firstCompatibleSize(product, color.name)?.label,
                          color.name,
                        );
                        const colorPrice = pairVariant?.price;
                        const selected = colorLabel === color.name;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            aria-label={
                              colorPrice != null
                                ? `${color.name}, ${formatInr(colorPrice)}`
                                : color.name
                            }
                            aria-pressed={selected}
                            disabled={!hasStock}
                            title={
                              colorPrice != null
                                ? `${color.name} — ${formatInr(colorPrice)}`
                                : color.name
                            }
                            className={cn(
                              "size-9 rounded-full border border-border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selected &&
                                "ring-2 ring-foreground ring-offset-2",
                              !matchesSize && hasStock && "opacity-35",
                              !hasStock && "cursor-not-allowed opacity-25",
                            )}
                            style={{
                              backgroundColor: color.hex ?? "#d4d4d4",
                            }}
                            onClick={() => hasStock && selectColor(color.name)}
                          />
                        );
                      })}
                    </div>
                  </fieldset>
                ) : null}

                {sizes.length > 0 ? (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">
                      Size{sizeLabel ? `: ${sizeLabel}` : ""}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const hasStock = sizeHasStock(product, size.label);
                        const matchesColor = isSizeCompatibleWithColor(
                          product,
                          size.label,
                          colorLabel,
                        );
                        const pairVariant = findExactVariant(
                          product,
                          size.label,
                          matchesColor
                            ? colorLabel
                            : firstCompatibleColor(product, size.label)?.name,
                        );
                        const sizePrice = pairVariant?.price;
                        const selected = sizeLabel === size.label;
                        return (
                          <button
                            key={size.id}
                            type="button"
                            disabled={!hasStock}
                            aria-pressed={selected}
                            title={
                              sizePrice != null
                                ? `${size.label} — ${formatInr(sizePrice)}`
                                : size.label
                            }
                            className={cn(
                              "flex min-w-11 flex-col items-center justify-center rounded-sm border px-2 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selected
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background",
                              !matchesColor && hasStock && "opacity-40",
                              !hasStock &&
                                "cursor-not-allowed opacity-30 line-through",
                            )}
                            onClick={() => hasStock && selectSize(size.label)}
                          >
                            <span>{size.label}</span>
                            {hasStock && sizePrice != null ? (
                              <span
                                className={cn(
                                  "text-[10px] font-normal",
                                  selected
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

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <div className="inline-flex items-center rounded-full border border-black bg-muted/40">
                    <button
                      type="button"
                      className="px-3 py-2"
                      onClick={() =>
                        setQuantity((value) => clampQty(value - 1))
                      }
                      aria-label="Decrease quantity"
                      disabled={!canPurchase}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-8 px-2 py-2 text-center text-sm">
                      {canPurchase ? quantity : 0}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-2"
                      onClick={() =>
                        setQuantity((value) => clampQty(value + 1))
                      }
                      aria-label="Increase quantity"
                      disabled={!canPurchase}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <Button
                    className="min-w-[8.5rem] flex-1 h-12 text-lg"
                    size="lg"
                    onClick={() => void addToCart()}
                    disabled={!canPurchase}
                  >
                    <ShoppingCart className="size-4" />
                    Add to cart
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 text-lg border border-black"
                  onClick={() => void buyNow()}
                  disabled={!canPurchase}
                >
                  Buy it now
                </Button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 self-start text-sm font-medium text-foreground transition-colors hover:text-primary disabled:opacity-50"
                  disabled={wishlistPending || wishlistAuthLoading}
                  onClick={() => void onWishlist()}
                >
                  <Heart
                    className={cn(
                      "size-4",
                      inWishlist && "fill-primary text-primary",
                    )}
                  />
                  {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
