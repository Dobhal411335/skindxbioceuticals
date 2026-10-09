"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CatalogProduct } from "@/data/catalog";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { formatPaiseToInr } from "@/lib/utils";
import { addCartItem } from "@/store/slices/cartSlice";

type FrequentlyBoughtProps = {
  product: CatalogProduct;
};

export function FrequentlyBought({ product }: FrequentlyBoughtProps) {
  const bundle = useMemo(() => product.bundle ?? [], [product.bundle]);
  const dispatch = useAppDispatch();
  const { openCart } = useCartUi();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((product.bundle ?? []).map((item) => [item.id, true])),
  );

  const selectedItems = useMemo(
    () => bundle.filter((item) => selected[item.id]),
    [bundle, selected],
  );

  const total = selectedItems.reduce((sum, item) => sum + item.priceInPaise, 0);
  const compare = Math.round(total * 1.1);

  function addAll() {
    selectedItems.forEach((item) => {
      dispatch(
        addCartItem({
          productId: item.id,
          variantId: "bundle",
          slug: item.slug,
          name: item.name,
          image: item.image,
          alt: item.alt,
          unitPriceInPaise: item.priceInPaise,
          quantity: 1,
        }),
      );
    });
    openCart();
  }

  if (bundle.length === 0) return null;

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
                <article className="w-40 rounded-lg border border-border bg-background p-3">
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
                  <Link href={`/shop/${item.slug}`} className="block">
                    <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-surface">
                      <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <p className="line-clamp-2 text-xs font-medium">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatPaiseToInr(item.priceInPaise)}
                    </p>
                  </Link>
                  <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                    <Link href={`/shop/${item.slug}`}>Choose options</Link>
                  </Button>
                </article>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">Price total</p>
            <p className="mt-1">
              <span className="text-muted-foreground line-through">
                {formatPaiseToInr(compare)}
              </span>{" "}
              <span className="text-lg font-semibold text-destructive">
                {formatPaiseToInr(total)}
              </span>
            </p>
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={selectedItems.length === 0}
              onClick={addAll}
            >
              Add all to cart
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Bundle total is a UI preview. Final pricing is confirmed server-side
              at checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
