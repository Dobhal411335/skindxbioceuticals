"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { buildCartPricingFields } from "@/features/products/product-pricing";
import { primaryImageUrl } from "@/features/products/product-selection";
import { useCartActions } from "@/hooks/useCartActions";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { formatInr } from "@/lib/utils";
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

  const { add: addToCartAction } = useCartActions();
  const { openCart } = useCartUi();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bundle.map((item) => [item.id, true])),
  );

  const selectedItems = useMemo(
    () => bundle.filter((item) => selected[item.id]),
    [bundle, selected],
  );

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  async function addAll() {
    const current = selectedItems.find((item) => item.isCurrent);
    const relatedSelected = selectedItems.filter((item) => !item.isCurrent);
    let added = 0;

    if (current) {
      const variant = product.variants.find((row) => row.isActive) ?? product.variants[0];
      if (variant && variant.quantity > 0) {
        const pricing = buildCartPricingFields(variant.price, product.coupon);
        const ok = await addToCartAction({
          productId: product.id,
          variantId: variant.id,
          slug: product.slug,
          name: product.name,
          image: primaryImageUrl(product),
          alt: product.name,
          unitPriceInPaise: pricing.unitPriceInPaise,
          originalUnitPriceInPaise: pricing.originalUnitPriceInPaise,
          discountCode: pricing.discountCode,
          discountInPaise: pricing.discountInPaise,
          quantity: 1,
        });
        if (ok) added += 1;
      }
    }

    if (relatedSelected.length > 0) {
      showInfo("Open related products to choose options before adding them.", {
        id: "cart.add.bundle.related",
      });
    }

    if (added > 0) {
      showSuccess("Added selected items to cart.", { id: "cart.add.bundle" });
      openCart();
      return;
    }

    showError("Could not add items to cart.", { id: "cart.add.error" });
  }

  if (related.length === 0) return null;

  return (
    <section className="space-y-4 rounded-xl border border-border p-4 sm:p-6">
      <h2 className="font-display text-xl font-semibold">Frequently bought together</h2>
      <div className="flex flex-wrap items-center gap-3">
        {bundle.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3">
            {index > 0 ? <Plus className="size-4 text-muted-foreground" /> : null}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2">
              <Checkbox
                checked={Boolean(selected[item.id])}
                onCheckedChange={(checked) =>
                  setSelected((prev) => ({
                    ...prev,
                    [item.id]: checked === true,
                  }))
                }
              />
              <div className="relative size-14 overflow-hidden rounded-md bg-surface">
                <Image
                  src={item.imageUrl || "https://placehold.co/112x112/png?text=SkinDx"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0">
                {item.isCurrent ? (
                  <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                ) : (
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                )}
                <p className="text-xs text-muted-foreground">{formatInr(item.price)}</p>
              </div>
            </label>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          Total: <span className="font-semibold">{formatInr(total)}</span>
        </p>
        <Button type="button" onClick={() => void addAll()}>
          Add selected to cart
        </Button>
      </div>
    </section>
  );
}
