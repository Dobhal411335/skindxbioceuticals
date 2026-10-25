"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: "sm" | "default";
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
  size = "default",
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "icon-sm" : "icon";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-primary bg-white shadow-sm",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="size-8 rounded-full text-black hover:bg-background hover:text-foreground disabled:bg-transparent disabled:opacity-10 sm:size-9"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label="Quantity"
        className={cn(
          "w-12 border-0 bg-transparent text-center font-semibold text-foreground shadow-none outline-none ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-0",
          size === "sm" ? "h-7" : "h-8 sm:h-9",
        )}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="size-8 rounded-full text-black hover:bg-background hover:text-foreground disabled:bg-transparent disabled:opacity-10 sm:size-9"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
