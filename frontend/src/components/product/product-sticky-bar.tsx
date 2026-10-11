"use client";

import Image from "next/image";
import { useState } from "react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogProduct } from "@/data/catalog";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showSuccess } from "@/lib/toast";
import { formatPaiseToInr } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";

type ProductStickyBarProps = {
  product: CatalogProduct;
};

export function ProductStickyBar({ product }: ProductStickyBarProps) {
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const availableSizes = product.sizes.filter((size) => size.available);
  const [sizeId, setSizeId] = useState(availableSizes[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selectedSize = product.sizes.find((size) => size.id === sizeId);

  function addToCart() {
    dispatch(
      addCartItem({
        productId: product.id,
        variantId: sizeId || "default",
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? "",
        alt: product.images[0]?.alt ?? product.name,
        variantLabel: selectedSize?.label,
        unitPriceInPaise: product.priceInPaise,
        quantity,
      }),
    );
    showSuccess("Added to cart.", { id: "cart.add" });
    openCart();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container-page flex flex-wrap items-center gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative hidden size-12 overflow-hidden rounded-md bg-surface sm:block">
            <Image
              src={product.images[0]?.src ?? ""}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-sm">{formatPaiseToInr(product.priceInPaise)}</p>
          </div>
        </div>

        {availableSizes.length > 0 ? (
          <Select value={sizeId} onValueChange={setSizeId}>
            <SelectTrigger className="w-[8.5rem]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <QuantityStepper size="sm" value={quantity} onChange={setQuantity} />
        <Button type="button" onClick={addToCart}>
          Add to cart
        </Button>
      </div>
    </div>
  );
}
