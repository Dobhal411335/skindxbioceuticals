"use client";

import { ShoppingCart} from "lucide-react";

import { useCartUi } from "@/components/cart/cart-ui-context";
import { Button } from "@/components/ui/button";
import { useCartTotals } from "@/hooks/useCartTotals";
export function HeaderCartButton() {
  const { openCart } = useCartUi();
  const { itemCount } = useCartTotals();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Open cart${itemCount ? `, ${itemCount} items` : ""}`}
      className="relative"
      onClick={openCart}
    >
      <ShoppingCart className="size-5" />
      {itemCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </Button>
  );
}
