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
import type { CustomerReview } from "@/types/customer-reviews";

type TestimonialsGridProps = {
  reviews?: CustomerReview[];
};

function ReviewCard({ review }: { review: CustomerReview }) {
  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  const initials = review.customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <figure className="flex h-full flex-col items-center gap-5 px-2 text-center">
      <div
        className="flex justify-center gap-0.5 text-foreground"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-4 ${i < rating ? "fill-current" : "text-muted-foreground/30"}`}
            aria-hidden
          />
        ))}
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
        {review.description}
      </blockquote>
      <figcaption className="flex w-full items-center justify-center gap-3 text-left">
        <Avatar size="xl">
          <AvatarImage src={review.imageUrl} alt="" />
          <AvatarFallback>{initials || "CU"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[15px] font-semibold">{review.customerName}</p>
          <p className="text-[12px] text-muted-foreground">{review.designation}</p>
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

          <CarouselContent className="-ml-4">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="basis-full pl-4 sm:basis-1/2 lg:basis-1/4"
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
