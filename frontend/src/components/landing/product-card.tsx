import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingProduct } from "@/data/landing";
import { formatPaiseToInr } from "@/lib/utils";

type ProductCardProps = {
  product: LandingProduct;
  showDiscountBadge?: boolean;
};

export function ProductCard({ product, showDiscountBadge = true }: ProductCardProps) {
  const hasCompare =
    typeof product.compareAtPaise === "number" &&
    product.compareAtPaise > product.pricePaise;
  const discountPct = hasCompare
    ? Math.round(
        ((product.compareAtPaise! - product.pricePaise) / product.compareAtPaise!) * 100,
      )
    : 0;

  return (
    <Card className="overflow-hidden border-border shadow-none">
      <Link href={product.href} className="group block focus-visible:outline-none">
        <div className="relative aspect-square bg-surface">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {showDiscountBadge && hasCompare ? (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              -{discountPct}%
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1 p-4">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {product.category}
          </p>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
            {product.name}
          </h3>
          <p className="text-sm">
            <span className="font-semibold">{formatPaiseToInr(product.pricePaise)}</span>
            {hasCompare ? (
              <span className="ml-2 text-muted-foreground line-through">
                {formatPaiseToInr(product.compareAtPaise!)}
              </span>
            ) : null}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
