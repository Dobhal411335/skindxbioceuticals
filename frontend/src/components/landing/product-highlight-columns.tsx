import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  bestsellerProducts,
  featuredProduct,
  recentProducts,
} from "@/data/landing";
import { formatPaiseToInr } from "@/lib/utils";
import type { LandingProduct } from "@/data/landing";

function ProductListItem({ product }: { product: LandingProduct }) {
  return (
    <li>
      <Link
        href={product.href}
        className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">
            {product.category}
          </p>
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-sm">{formatPaiseToInr(product.pricePaise)}</p>
        </div>
      </Link>
    </li>
  );
}

export function ProductHighlightColumns() {
  return (
    <section
      className="container-page section-space"
      aria-labelledby="highlights-heading"
    >
      <h2 id="highlights-heading" className="sr-only">
        Product highlights
      </h2>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Recent products</h3>
          <ul className="space-y-1">
            {recentProducts.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </ul>
        </div>

        <Card className="border-2 border-accent shadow-none">
          <CardContent className="flex h-full flex-col p-5">
            <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-surface">
              <Image
                src={featuredProduct.image}
                alt={featuredProduct.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
            <p className="text-sm text-muted-foreground">Featured this week</p>
            <p className="mt-1 text-[11px] font-semibold tracking-wider text-accent uppercase">
              {featuredProduct.category}
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold">
              {featuredProduct.name}
            </h3>
            <p className="mt-2 text-lg font-semibold">
              {formatPaiseToInr(featuredProduct.pricePaise)}
            </p>
            <Button asChild className="mt-auto w-full" size="lg">
              <Link href={featuredProduct.href}>View product</Link>
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Our bestsellers</h3>
          <ul className="space-y-1">
            {bestsellerProducts.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
