"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  primaryImageUrl,
  rupeesToPaise,
} from "@/features/products/product-selection";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { showError, showSuccess } from "@/lib/toast";
import { formatInr } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";
import type { PublicProductDetail, PublicRelatedProduct } from "@/types/product";

type FrequentlyBoughtProps = {
  product: PublicProductDetail;
};

type BundleItem = PublicRelatedProduct & { isCurrent?: boolean };

export function FrequentlyBought({ product }: FrequentlyBoughtProps) {
  const related = product.relatedProducts.slice(0, 4);
  const currentPrice = product.variants[0]?.price ?? 0;
  const bundle: BundleItem[] = useMemo(
    () => [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        imageUrl: primaryImageUrl(product) || null,
        isCurrent: true,
      },
      ...related,
    ],
    [product, related, currentPrice],
  );

  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bundle.map((item) => [item.id, true])),
  );

  const selectedItems = useMemo(
    () => bundle.filter((item) => selected[item.id]),
    [bundle, selected],
  );

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  function addAll() {
    try {
      selectedItems.forEach((item) => {
        if (item.isCurrent) {
          const variant = product.variants[0];
          if (!variant || variant.quantity <= 0) return;
          dispatch(
            addCartItem({
              productId: product.id,
              variantId: variant.id,
              slug: product.slug,
              name: product.name,
              image: primaryImageUrl(product),
              alt: product.name,
              unitPriceInPaise: rupeesToPaise(variant.price),
              quantity: 1,
            }),
          );
          return;
        }

        dispatch(
          addCartItem({
            productId: item.id,
            variantId: "related",
            slug: item.slug,
            name: item.name,
            image: item.imageUrl ?? "",
            alt: item.name,
            unitPriceInPaise: rupeesToPaise(item.price),
            quantity: 1,
          }),
        );
      });
      showSuccess("Added selected items to cart.", { id: "cart.add.bundle" });
      openCart();
    } catch {
      showError("Could not add items to cart.", { id: "cart.add.error" });
    }
  }

  if (related.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface/60">
      <div className="container-page section-space">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Frequently bought together
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_16rem]">
          <div className="flex flex-wrap items-center gap-3">
            {bundle.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                {index > 0 ? (
                  <Plus className="size-4 text-muted-foreground" aria-hidden />
                ) : null}
                <article className="w-52 rounded-lg border border-border bg-background p-4 sm:w-56">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Checkbox
                      checked={selected[item.id] ?? false}
                      onCheckedChange={(checked) =>
                        setSelected((current) => ({
                          ...current,
                          [item.id]: checked === true,
                        }))
                      }
                      aria-label={`Include ${item.name}`}
                    />
                  </div>
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-surface">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="224px"
                        />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatInr(item.price)}
                    </p>
                  </Link>
                  {!item.isCurrent ? (
                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                      <Link href={`/products/${item.slug}`}>Choose options</Link>
                    </Button>
                  ) : null}
                </article>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Price total</p>
            <p className="mt-1 text-lg font-semibold">{formatInr(total)}</p>
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={selectedItems.length === 0}
              onClick={addAll}
            >
              Add all to cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
