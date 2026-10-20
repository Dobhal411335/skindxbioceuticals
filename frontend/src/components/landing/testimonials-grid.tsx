"use client";

import { Pause, Play, Star } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import type { CustomerReview } from "@/types/customer-reviews";

type TestimonialsGridProps = {
  reviews?: CustomerReview[];
};

function getReviewHeading(review: CustomerReview): string {
  const customHeading =
    (review as unknown as { heading?: string; title?: string }).heading ||
    (review as unknown as { heading?: string; title?: string }).title;
  if (customHeading && customHeading.trim()) {
    return customHeading.trim();
  }
  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  switch (rating) {
    case 5:
      return "Perfection";
    case 4:
      return "Great Experience";
    case 3:
      return "Good Service";
    default:
      return "Customer Feedback";
  }
}

function ReviewCard({ review }: { review: CustomerReview }) {
  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  const initials = review.customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const heading = getReviewHeading(review);

  return (
    <figure className="flex h-full w-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md text-left">
      <div className="space-y-3.5">
        {/* Stars inside square badges (Trustpilot style) */}
        <div
          className="flex items-center gap-1"
          aria-label={`${rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex size-6 items-center justify-center rounded-[3px]",
                i < rating
                  ? "bg-[#00b67a]"
                  : "bg-muted text-muted-foreground/30 border border-border",
              )}
            >
              <Star
                className={cn(
                  "size-3.5",
                  i < rating
                    ? "fill-white text-white"
                    : "fill-transparent text-muted-foreground/40",
                )}
                aria-hidden
              />
            </div>
          ))}
        </div>

        {/* Heading */}
        <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          {heading}
        </h3>

        {/* Description */}
        <blockquote className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
          {review.description}
        </blockquote>
      </div>

      {/* Author row: image, name, and designation */}
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4">
        <Avatar size="lg">
          <AvatarImage src={review.imageUrl} alt={review.customerName} />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials || "CU"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {review.customerName}
          </p>
          {review.designation ? (
            <p className="truncate text-xs text-muted-foreground">
              {review.designation}
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialsGrid({ reviews = [] }: TestimonialsGridProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [isPaused, setIsPaused] = useState(false);

  useCarouselAutoplay(api, {
    enabled: reviews.length > 1,
    paused: isPaused,
    intervalMs: 5000,
  });

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section
      className="border-y border-border bg-surface/50"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-page section-space">
        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <div className="relative mb-10">
            <div className="mx-auto max-w-2xl px-14 text-center sm:px-20">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Testimonials
              </p>
              <h2
                id="testimonials-heading"
                className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Customer feedback
              </h2>
            </div>

            {reviews.length > 4 ? (
              <div className="absolute top-0 right-0 z-10 flex items-center gap-3 sm:top-1/2 sm:-translate-y-1/2">
                <CarouselPrevious className="static inset-auto size-8 translate-y-0 border-border bg-background/90 text-foreground shadow-sm" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8 rounded-full border-border bg-background/90 shadow-sm"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-label={
                    isPaused
                      ? "Play testimonials carousel"
                      : "Pause testimonials carousel"
                  }
                >
                  {isPaused ? (
                    <Play className="size-3.5 fill-current" aria-hidden />
                  ) : (
                    <Pause className="size-3.5 fill-current" aria-hidden />
                  )}
                </Button>
                <CarouselNext className="static inset-auto size-8 translate-y-0 border-border bg-background/90 text-foreground shadow-sm" />
              </div>
            ) : null}
          </div>

          <CarouselContent className="-ml-4 py-2">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="flex basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <ReviewCard review={review} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
