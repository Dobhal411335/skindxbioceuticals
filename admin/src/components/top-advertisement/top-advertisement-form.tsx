"use client";

import { LayoutTemplate, Megaphone, Plus, Sparkles, Trash2 } from "lucide-react";

import { createEmptyItem } from "@/components/top-advertisement/top-advertisement-form-utils";
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
import type { TopAdvertisementFormErrors } from "@/schemas/top-advertisement-schema";
import type {
  TopAdvertisementFormValues,
  TopAdvertisementItemFormValues,
} from "@/types/top-advertisement";

type SectionKey = "announcements" | "utilityItems" | "benefits";

type TopAdvertisementFormProps = {
  values: TopAdvertisementFormValues;
  errors: TopAdvertisementFormErrors;
  onChange: (next: TopAdvertisementFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formId?: string;
};

function updateItem(
  values: TopAdvertisementFormValues,
  section: SectionKey,
  index: number,
  patch: Partial<TopAdvertisementItemFormValues>,
): TopAdvertisementFormValues {
  return {
    ...values,
    [section]: values[section].map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    ),
  };
}

function removeItem(
  values: TopAdvertisementFormValues,
  section: SectionKey,
  index: number,
): TopAdvertisementFormValues {
  return {
    ...values,
    [section]: values[section].filter((_, itemIndex) => itemIndex !== index),
  };
}

export function TopAdvertisementForm({
  values,
  errors,
  onChange,
  onSubmit,
  formId = "top-advertisement-form",
}: TopAdvertisementFormProps) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 1 — Announcement bar
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Top page announcements. One active item shows centered; more than
                one active item scrolls as a marquee.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() =>
                onChange({
                  ...values,
                  announcements: [...values.announcements, createEmptyItem()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.announcements ? (
            <p className="text-xs text-destructive">{errors.announcements}</p>
          ) : null}
          {values.announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No announcement items yet. Add one to show the top bar.
            </p>
          ) : null}
          {values.announcements.map((item, index) => (
            <div
              key={`announcement-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Announcement {index + 1}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        onChange(
                          updateItem(values, "announcements", index, {
                            active: checked,
                          }),
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange(removeItem(values, "announcements", index))
                    }
                    aria-label={`Remove announcement ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`announcement-${index}-text`}>Text</Label>
                <Input
                  id={`announcement-${index}-text`}
                  value={item.text}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "announcements", index, {
                        text: event.target.value,
                      }),
                    )
                  }
                  placeholder="e.g. Get 20% off on your first order"
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`announcement-${index}-url`}>
                  Target URL (optional)
                </Label>
                <Input
                  id={`announcement-${index}-url`}
                  value={item.url}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "announcements", index, {
                        url: event.target.value,
                      }),
                    )
                  }
                  placeholder="/shop or https://..."
                  className="h-11"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 2 — Header utility strip
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Short left/right utility lines under the announcement bar. First
                active item is left; second is right.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() =>
                onChange({
                  ...values,
                  utilityItems: [...values.utilityItems, createEmptyItem()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.utilityItems ? (
            <p className="text-xs text-destructive">{errors.utilityItems}</p>
          ) : null}
          {values.utilityItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No utility lines yet. Storefront falls back to static defaults.
            </p>
          ) : null}
          {values.utilityItems.map((item, index) => (
            <div
              key={`utility-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Utility line {index + 1}
                  {index === 0 ? " (left)" : index === 1 ? " (right)" : ""}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        onChange(
                          updateItem(values, "utilityItems", index, {
                            active: checked,
                          }),
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange(removeItem(values, "utilityItems", index))
                    }
                    aria-label={`Remove utility line ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`utility-${index}-text`}>Text</Label>
                <Input
                  id={`utility-${index}-text`}
                  value={item.text}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "utilityItems", index, {
                        text: event.target.value,
                      }),
                    )
                  }
                  placeholder={
                    index === 0
                      ? "India storefront · Prices in INR"
                      : "Complimentary shipping over ₹999"
                  }
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`utility-${index}-url`}>
                  Target URL (optional)
                </Label>
                <Input
                  id={`utility-${index}-url`}
                  value={item.url}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "utilityItems", index, {
                        url: event.target.value,
                      }),
                    )
                  }
                  placeholder="/policies/shipping"
                  className="h-11"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 3 — Feature benefits bar
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Benefit titles with an optional link.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() =>
                onChange({
                  ...values,
                  benefits: [...values.benefits, createEmptyItem()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add benefit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.benefits ? (
            <p className="text-xs text-destructive">{errors.benefits}</p>
          ) : null}
          {values.benefits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No benefits yet. Storefront falls back to static landing benefits.
            </p>
          ) : null}
          {values.benefits.map((item, index) => (
            <div
              key={`benefit-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Benefit {index + 1}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        onChange(
                          updateItem(values, "benefits", index, {
                            active: checked,
                          }),
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange(removeItem(values, "benefits", index))
                    }
                    aria-label={`Remove benefit ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`benefit-${index}-text`}>Title</Label>
                <Input
                  id={`benefit-${index}-text`}
                  value={item.text}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "benefits", index, {
                        text: event.target.value,
                      }),
                    )
                  }
                  placeholder="e.g. Free shipping"
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`benefit-${index}-url`}>
                  Target URL (optional)
                </Label>
                <Input
                  id={`benefit-${index}-url`}
                  value={item.url}
                  onChange={(event) =>
                    onChange(
                      updateItem(values, "benefits", index, {
                        url: event.target.value,
                      }),
                    )
                  }
                  placeholder="/policies/shipping"
                  className="h-11"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}
