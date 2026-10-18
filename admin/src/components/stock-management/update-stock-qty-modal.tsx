"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";
import { ApiError } from "@/services/api/errors";
import { updateStockVariantQty } from "@/services/api/stock-management";
import type { SiteCode } from "@/types/auth";
import type { AdminStockListItemDto } from "@/types/stock-management";
import { variantQtyLabel } from "@/components/stock-management/stock-qty-badge";

type DraftQty = Record<string, number>;

function buildDraft(product: AdminStockListItemDto | null): DraftQty {
  if (!product) return {};
  const next: DraftQty = {};
  for (const variant of product.variants) {
    next[variant.id] = variant.quantity;
  }
  return next;
}

export function UpdateStockQtyModal({
  siteCode,
  product,
  open,
  onOpenChange,
  onUpdated,
}: {
  siteCode: SiteCode;
  product: AdminStockListItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (productId: string, variantId: string, quantity: number) => void;
}) {
  const [draft, setDraft] = useState<DraftQty>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(product));
      setSavingVariantId(null);
    }
  }, [open, product]);

  const setQty = (variantId: string, value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    setDraft((prev) => ({ ...prev, [variantId]: safe }));
  };

  const handleSaveVariant = async (variantId: string) => {
    const quantity = draft[variantId] ?? 0;
    setSavingVariantId(variantId);
    try {
      const result = await updateStockVariantQty(siteCode, variantId, quantity);
      showSuccess("Stock quantity updated");
      onUpdated(result.productId, result.variantId, result.quantity);
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update stock quantity",
      );
    } finally {
      setSavingVariantId(null);
    }
  };

  const variants = product?.variants ?? [];
  const isSimple = product?.isSimpleOffer ?? true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update quantity For</DialogTitle>
          <DialogDescription>
            {product
              ? `${product.productCode} · ${product.name}`
              : "Adjust on-hand quantity, then save."}
          </DialogDescription>
        </DialogHeader>

        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            This product has no price/quantity offers yet. Add variants on the
            product edit page before updating stock.
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant) => {
              const qty = draft[variant.id] ?? variant.quantity;
              const label = isSimple
                ? "Product qty"
                : variantQtyLabel(
                    variant.sizeLabel,
                    variant.colorLabel,
                    variant.name,
                  );
              const dirty = qty !== variant.quantity;
              const saving = savingVariantId === variant.id;

              return (
                <div
                  key={variant.id}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <Label className="mb-2 block text-sm font-medium">
                    {label}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      disabled={saving || qty <= 0}
                      onClick={() => setQty(variant.id, qty - 1)}
                      aria-label={`Decrease ${label}`}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      className="w-24 text-center tabular-nums"
                      value={qty}
                      disabled={saving}
                      onChange={(event) =>
                        setQty(variant.id, Number(event.target.value))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      disabled={saving}
                      onClick={() => setQty(variant.id, qty + 1)}
                      aria-label={`Increase ${label}`}
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="ml-auto py-5 px-10 text-base"
                      disabled={saving || !dirty}
                      onClick={() => void handleSaveVariant(variant.id)}
                    >
                      {saving ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="p-5 text-sm bg-red-500 text-white"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
