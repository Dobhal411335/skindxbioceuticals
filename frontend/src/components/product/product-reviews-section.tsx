"use client";

import Image from "next/image";
import { useState } from "react";
import { Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import { cn } from "@/lib/utils";
import type { PublicProductDetail, PublicProductEditorialReview } from "@/types/product";

type ProductReviewsSectionProps = {
  product: PublicProductDetail;
};

const CARD_TONES = [
  "bg-emerald-50/80",
  "bg-sky-50/80",
  "bg-amber-50/80",
  "bg-rose-50/80",
  "bg-violet-50/80",
] as const;

function ReviewCard({
  review,
  toneClass,
}: {
  review: PublicProductEditorialReview;
  toneClass: string;
}) {
  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  const initials = review.createdByName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <figure
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg border border-border/60 p-5",
        toneClass,
      )}
    >
      <div
        className="flex gap-0.5 text-foreground"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "size-4",
              index < rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
            aria-hidden
          />
        ))}
      </div>
      {review.title ? (
        <p className="text-sm font-semibold text-foreground">{review.title}</p>
      ) : null}
      <blockquote
        className="rich-html text-justify flex-1 text-[12px] leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: review.body }}
      />
      <figcaption className="flex items-center gap-3">
        {review.imageUrl ? (
          <div className="relative size-10 overflow-hidden rounded-full bg-surface">
            <Image
              src={review.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-background text-xs font-semibold">
            {initials || "CU"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{review.createdByName}</p>
          <p className="text-xs text-muted-foreground">Verified customer</p>
        </div>
      </figcaption>
    </figure>
  );
}

export function ProductReviewsSection({ product }: ProductReviewsSectionProps) {
  const reviews = product.editorialReviews ?? [];
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);

  useCarouselAutoplay(api, {
    enabled: reviews.length > 1,
    paused: isPaused,
    intervalMs: 5000,
  });

  if (reviews.length === 0 && product.reviewCount === 0) {
    return null;
  }

  const filled = Math.round(Math.min(5, Math.max(0, product.averageRating)));

  return (
    <section
      id="product-reviews"
      className="scroll-mt-24 border-y border-border bg-surface/40"
      aria-labelledby="product-reviews-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-page section-space">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Reviews
            </p>
            <h2
              id="product-reviews-heading"
              className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Customer reviews
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div
                className="flex items-center gap-0.5"
                aria-label={`Average rating ${product.averageRating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "size-4",
                      index < filled
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="font-medium text-foreground">
                {product.averageRating.toFixed(1)}
              </span>
              <span>
                from {product.reviewCount}{" "}
                {product.reviewCount === 1 ? "customer" : "customers"}
              </span>
            </div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: reviews.length > 1 }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {reviews.map((review, index) => (
                <CarouselItem
                  key={review.id}
                  className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
                >
                  <ReviewCard
                    review={review}
                    toneClass={CARD_TONES[index % CARD_TONES.length]!}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {reviews.length > 1 ? (
              <>
                <CarouselPrevious className="-left-3 hidden border-border bg-background/90 shadow-sm md:flex" />
                <CarouselNext className="-right-3 hidden border-border bg-background/90 shadow-sm md:flex" />
              </>
            ) : null}
          </Carousel>
        ) : (
          <p className="text-sm text-muted-foreground">
            Reviews are being collected for this product.
          </p>
        )}
      </div>
    </section>
  );
}
