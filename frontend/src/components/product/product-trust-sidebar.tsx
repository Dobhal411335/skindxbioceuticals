import Image from "next/image";
import Link from "next/link";
import { Package, Percent, Truck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CatalogProduct } from "@/data/catalog";
import { formatPaiseToInr } from "@/lib/utils";

type ProductTrustSidebarProps = {
  product: CatalogProduct;
};

export function ProductTrustSidebar({ product }: ProductTrustSidebarProps) {
  return (
    <aside className="space-y-8">
      <div>
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
          Further info
        </h2>
        <Accordion type="single" collapsible defaultValue="shipping">
          <AccordionItem value="shipping">
            <AccordionTrigger className="text-sm">
              <span className="inline-flex items-center gap-2">
                <Truck className="size-4" aria-hidden />
                Free shipping over ₹999
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Eligible domestic orders over ₹999 qualify for complimentary
              standard shipping once fulfilment is connected.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="savings">
            <AccordionTrigger className="text-sm">
              <span className="inline-flex items-center gap-2">
                <Percent className="size-4" aria-hidden />
                Member savings
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Coupons and promotions are validated server-side at checkout —
              never trust client-only discounts.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger className="text-sm">
              <span className="inline-flex items-center gap-2">
                <Package className="size-4" aria-hidden />
                Easy returns
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Return eligibility depends on product type and condition. Full
              terms appear on the Returns policy page.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {product.pairsWith ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Pairs well with
          </h2>
          <Link
            href={`/shop/${product.pairsWith.slug}`}
            className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface">
              <Image
                src={product.pairsWith.image}
                alt={product.pairsWith.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div>
              <p className="text-sm font-medium">{product.pairsWith.name}</p>
              <p className="mt-1 text-sm font-semibold">
                {formatPaiseToInr(product.pairsWith.priceInPaise)}
              </p>
            </div>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
