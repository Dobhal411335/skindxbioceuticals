import { ChevronRight, Package, Percent, Tag, Truck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PublicProductDetail } from "@/types/product";

type ProductTrustSidebarProps = {
  product: PublicProductDetail;
  sizeId?: string;
  colorId?: string;
};

export function ProductTrustSidebar({
  product,
}: ProductTrustSidebarProps) {
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
                {product.coupon
                  ? `Coupon ${product.coupon.code}`
                  : "Member savings"}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {product.coupon
                ? `Display coupon ${product.coupon.code}. Coupons and promotions are validated server-side at checkout.`
                : "Coupons and promotions are validated server-side at checkout — never trust client-only discounts."}
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
      {product.tags.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Tags
          </h2>
          <ul className="flex flex-col gap-2">
            {product.tags.map((tag) => (
              <li key={tag.id}>
                <div className="flex w-full items-center justify-between gap-3 rounded border border-foreground bg-background px-5 py-3">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <Tag className="size-4 shrink-0 text-foreground" aria-hidden />
                    <span className="truncate text-sm font-semibold text-foreground">
                      {tag.name}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-foreground"
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
