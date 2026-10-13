"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectWishlistCount } from "@/store/slices/wishlistSlice";

export function HeaderWishlistButton() {
  const count = useAppSelector(selectWishlistCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative hidden sm:inline-flex"
    >
      <Link
        href="/wishlist"
        aria-label={`Wishlist${count ? `, ${count} items` : ""}`}
      >
        <Heart className="size-5" />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
