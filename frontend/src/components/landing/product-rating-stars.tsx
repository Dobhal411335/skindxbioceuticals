import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductRatingStarsProps = {
  averageRating: number;
  reviewCount: number;
  className?: string;
};

export function ProductRatingStars({
  averageRating,
  reviewCount,
  className,
}: ProductRatingStarsProps) {
  const filled = Math.round(Math.min(5, Math.max(0, averageRating)));

  return (
    <div
      className={cn("flex items-center gap-1 text-muted-foreground", className)}
      aria-label={
        reviewCount > 0
          ? `Rated ${averageRating} out of 5 from ${reviewCount} reviews`
          : "No reviews yet"
      }
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4",
            index < filled
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/50",
          )}
          aria-hidden
        />
      ))}
      <span className="text-xs">({reviewCount})</span>
    </div>
  );
}
