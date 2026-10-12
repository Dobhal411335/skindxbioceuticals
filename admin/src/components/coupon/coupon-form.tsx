"use client";

import { BadgePercent } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CouponFormErrors } from "@/schemas/coupon-schema";
import type { CouponFormValues } from "@/types/coupon";

type CouponFormProps = {
  values: CouponFormValues;
  errors: CouponFormErrors;
  isSubmitting: boolean;
  isEditing: boolean;
  onChange: (values: CouponFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export function CouponForm({
  values,
  errors,
  isSubmitting,
  isEditing,
  onChange,
  onSubmit,
  onReset,
}: CouponFormProps) {
  const amountFilled = values.amount.trim() !== "";
  const percentFilled = values.percent.trim() !== "";

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-2">
          <BadgePercent className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">
            {isEditing ? "Edit Coupon Code" : "Create Coupon Code"}
          </CardTitle>
        </div>
        <CardDescription>
          Set a code and either a fixed amount or a percent discount — not both.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coupon-code" className="text-sm font-semibold">
                Coupon code name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-code"
                value={values.code}
                onChange={(event) =>
                  onChange({ ...values, code: event.target.value.toUpperCase() })
                }
                placeholder="SAVE10"
                className="h-11 uppercase"
                autoComplete="off"
              />
              {errors.code ? (
                <p className="text-sm text-destructive">{errors.code}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-amount" className="text-sm font-semibold">
                Amount (fixed)
              </Label>
              <Input
                id="coupon-amount"
                type="number"
                min={0}
                step="0.01"
                value={values.amount}
                disabled={percentFilled}
                onChange={(event) =>
                  onChange({
                    ...values,
                    amount: event.target.value,
                    percent: event.target.value.trim() ? "" : values.percent,
                  })
                }
                placeholder="100"
                className="h-11"
              />
              {errors.amount ? (
                <p className="text-sm text-destructive">{errors.amount}</p>
              ) : percentFilled ? (
                <p className="text-xs text-muted-foreground">
                  Clear percent to enter an amount.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-percent" className="text-sm font-semibold">
                Percent (%)
              </Label>
              <Input
                id="coupon-percent"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={values.percent}
                disabled={amountFilled}
                onChange={(event) =>
                  onChange({
                    ...values,
                    percent: event.target.value,
                    amount: event.target.value.trim() ? "" : values.amount,
                  })
                }
                placeholder="10"
                className="h-11"
              />
              {errors.percent ? (
                <p className="text-sm text-destructive">{errors.percent}</p>
              ) : amountFilled ? (
                <p className="text-xs text-muted-foreground">
                  Clear amount to enter a percent.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-starts-at" className="text-sm font-semibold">
                Start date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-starts-at"
                type="date"
                value={values.startsAt}
                onChange={(event) =>
                  onChange({ ...values, startsAt: event.target.value })
                }
                className="h-11"
              />
              {errors.startsAt ? (
                <p className="text-sm text-destructive">{errors.startsAt}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-ends-at" className="text-sm font-semibold">
                End date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coupon-ends-at"
                type="date"
                value={values.endsAt}
                onChange={(event) =>
                  onChange({ ...values, endsAt: event.target.value })
                }
                className="h-11"
              />
              {errors.endsAt ? (
                <p className="text-sm text-destructive">{errors.endsAt}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 md:col-span-2">
              <div>
                <Label htmlFor="coupon-active" className="text-sm font-semibold">
                  Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive coupons are hidden from product-edit assignment.
                </p>
              </div>
              <Switch
                id="coupon-active"
                checked={values.isActive}
                onCheckedChange={(checked) =>
                  onChange({ ...values, isActive: checked })
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update coupon"
                  : "Create coupon"}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={onReset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
