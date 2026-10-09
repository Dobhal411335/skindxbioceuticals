import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { galleryFeaturedProduct, galleryItems } from "@/data/landing";
import { cn } from "@/lib/utils";

export function StyleGallery() {
  return (
    <section className="container-page section-space" aria-labelledby="gallery-heading">
      <h2
        id="gallery-heading"
        className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        #Lookbook Gallery
      </h2>

      <div className="mt-10 flex items-end justify-center gap-2 overflow-x-auto pb-2 sm:gap-3 md:gap-4">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative w-28 shrink-0 overflow-hidden bg-surface sm:w-36 md:w-44",
              item.featured
                ? "aspect-[3/5] md:w-52"
                : "aspect-[3/4] self-center",
            )}
          >
            <Image
              src={item.image}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="208px"
            />
          </div>
        ))}
      </div>

      <Card className="mx-auto mt-8 max-w-md border-border shadow-none">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-surface">
            <Image
              src={galleryFeaturedProduct.image}
              alt={galleryFeaturedProduct.alt}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {galleryFeaturedProduct.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {galleryFeaturedProduct.priceLabel}
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={galleryFeaturedProduct.href}>Choose options</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
