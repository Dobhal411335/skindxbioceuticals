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
    <div className={cn("inline-flex items-center", className)}>
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        className="rounded-r-none"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="size-3.5" />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label="Quantity"
        className={cn(
          "w-12 rounded-none border-x-0 text-center shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" ? "h-7" : "h-8",
        )}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
      />
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        className="rounded-l-none"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
