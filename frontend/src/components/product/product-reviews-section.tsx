"use client";

import Image from "next/image";
import { useState } from "react";
import { Pause, Play, Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicProductDetail, PublicProductEditorialReview } from "@/types/product";

type ProductReviewsSectionProps = {
  product: PublicProductDetail;
};

function ReviewCard({ review }: { review: PublicProductEditorialReview }) {
  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  const initials = review.createdByName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <figure className="flex h-full flex-col justify-between rounded-2xl border border-black/[0.06] bg-white p-7 text-left shadow-[0_2px_12px_rgba(20,30,40,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(20,30,40,0.1)] sm:p-8">
      <div className="flex items-center gap-1.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "size-5",
              index < rating
                ? "fill-[#ef6a24] text-[#ef6a24]"
                : "fill-transparent text-[#ef6a24]/30",
            )}
            aria-hidden
          />
        ))}
      </div>
      {review.title ? (
        <p className="text-lg font-semibold tracking-tight text-[#17283d] sm:text-xl">
          {review.title}
        </p>
      ) : null}
      <blockquote
        className="rich-html mt-5 line-clamp-6 flex-1 text-base italic leading-relaxed text-[#34475c]"
        dangerouslySetInnerHTML={{ __html: review.body }}
      />
      <figcaption className="mt-8 flex items-center gap-3 border-t border-[#e8e5df] pt-5">
        {review.imageUrl ? (
          <div className="relative size-15 border bordre-primary overflow-hidden rounded-full bg-surface">
            <Image src={review.imageUrl} alt="" fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-[#ef6a24]/10 text-xs font-semibold text-[#ef6a24]">
            {initials || "CU"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[#17283d]">{review.createdByName}</p>
          <p className="text-xs text-[#657487]">Verified customer</p>
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
      className="scroll-mt-24 overflow-hidden border-y border-[#e8e5df] bg-[#f7f5f1]"
      aria-labelledby="product-reviews-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-page section-space sm:py-20 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[#ef6a24] uppercase">
              Community voices
            </p>
            <h2
              id="product-reviews-heading"
              className="mt-2 text-4xl font-semibold tracking-tight text-[#101d2d] sm:text-5xl"
            >
              What customers say
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
                      "size-5",
                      index < filled
                        ? "fill-[#ef6a24] text-[#ef6a24]"
                        : "fill-transparent text-[#ef6a24]/30",
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="font-semibold text-[#17283d]">
                {product.averageRating.toFixed(1)}
              </span>
              <span>
                from {product.reviewCount} {product.reviewCount === 1 ? "customer" : "customers"}
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
            <CarouselContent className="-ml-5 py-2">
            {reviews.map((review) => (
                <CarouselItem
                  key={review.id}
                  className="flex basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
                >
                  <ReviewCard review={review} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {reviews.length > 1 ? (
              <>
                <CarouselPrevious className="-left-3 hidden border-[#dedbd5] bg-white text-[#17283d] shadow-sm md:flex" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute top-1/2 right-10 z-10 hidden size-10 -translate-y-1/2 rounded-full border-[#dedbd5] bg-white text-[#17283d] shadow-sm md:flex"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-label={isPaused ? "Play product reviews" : "Pause product reviews"}
                >
                  {isPaused ? (
                    <Play className="size-3.5 fill-current" />
                  ) : (
                    <Pause className="size-3.5 fill-current" />
                  )}
                </Button>
                <CarouselNext className="-right-3 hidden border-[#dedbd5] bg-white text-[#17283d] shadow-sm md:flex" />
              </>
            ) : null}
          </Carousel>
        ) : null}
      </div>
    </section>
  );
}
