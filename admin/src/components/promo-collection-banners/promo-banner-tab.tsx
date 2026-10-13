"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  createEmptyPromoItem,
  moveItem,
} from "@/components/promo-collection-banners/promo-collection-form-utils";
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
import { showError } from "@/lib/toast";
import type { PromoBannerFormErrors } from "@/schemas/promo-collection-banners-schema";
import { uploadPromoBannerImage } from "@/services/api/promo-banner";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  PromoBannerFormValues,
  PromoBannerItemFormValues,
} from "@/types/promo-collection-banners";

type PromoBannerTabProps = {
  siteCode: SiteCode;
  entityId: string | null;
  values: PromoBannerFormValues;
  errors: PromoBannerFormErrors;
  onChange: (next: PromoBannerFormValues) => void;
  formId?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function updateItem(
  values: PromoBannerFormValues,
  index: number,
  patch: Partial<PromoBannerItemFormValues>,
): PromoBannerFormValues {
  return {
    ...values,
    items: values.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  };
}

export function PromoBannerTab({
  siteCode,
  entityId,
  values,
  errors,
  onChange,
  formId = "promo-banner-form",
  onSubmit,
}: PromoBannerTabProps) {
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleUpload = async (index: number, file?: File) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const uploaded = await uploadPromoBannerImage(siteCode, file, entityId);
      onChange(
        updateItem(values, index, {
          image: { url: uploaded.url, publicId: uploaded.publicId },
        }),
      );
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to upload image",
      );
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Promo banner row
              </CardTitle>
              <CardDescription className="mt-1">
                Image tiles with mini heading, heading, and CTA. Storefront
                shows three at a time.
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
                  items: [...values.items, createEmptyPromoItem()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add new banner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {errors.items ? (
            <p className="text-xs text-destructive">{errors.items}</p>
          ) : null}
          {values.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No promo banners yet. Add an image, headings, and optional CTA for
              the home carousel.
            </p>
          ) : null}

          {values.items.map((item, index) => (
            <div
              key={item.clientKey}
              className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  Banner {index + 1}
                </p>
                <div className="flex items-center gap-1">
                  <div className="mr-2 flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        onChange(updateItem(values, index, { active: checked }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() =>
                      onChange({
                        ...values,
                        items: moveItem(values.items, index, "up"),
                      })
                    }
                    aria-label="Move banner up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === values.items.length - 1}
                    onClick={() =>
                      onChange({
                        ...values,
                        items: moveItem(values.items, index, "down"),
                      })
                    }
                    aria-label="Move banner down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onChange({
                        ...values,
                        items: values.items.filter((_, i) => i !== index),
                      })
                    }
                    aria-label="Remove banner"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  <Label>Image</Label>
                  {item.image.url ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin Cloudinary preview */}
                      <img
                        src={item.image.url}
                        alt=""
                        className="h-36 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={uploadingIndex === index}
                      onClick={() => fileRefs.current[index]?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingIndex === index ? "Uploading…" : "Upload"}
                    </Button>
                    {item.image.url ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onChange(
                            updateItem(values, index, {
                              image: { url: "", publicId: "" },
                            }),
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <input
                    ref={(node) => {
                      fileRefs.current[index] = node;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void handleUpload(index, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className="grid gap-4 self-start">
                  <div className="grid gap-2">
                    <Label htmlFor={`promo-mini-heading-${index}`}>
                      Mini heading
                    </Label>
                    <Input
                      id={`promo-mini-heading-${index}`}
                      value={item.miniHeading}
                      onChange={(event) =>
                        onChange(
                          updateItem(values, index, {
                            miniHeading: event.target.value,
                          }),
                        )
                      }
                      placeholder="e.g. New arrival"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`promo-heading-${index}`}>Heading</Label>
                    <Input
                      id={`promo-heading-${index}`}
                      value={item.heading}
                      onChange={(event) =>
                        onChange(
                          updateItem(values, index, {
                            heading: event.target.value,
                          }),
                        )
                      }
                      placeholder="e.g. Barrier essentials"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`promo-button-label-${index}`}>
                        Button label
                      </Label>
                      <Input
                        id={`promo-button-label-${index}`}
                        value={item.buttonLabel}
                        onChange={(event) =>
                          onChange(
                            updateItem(values, index, {
                              buttonLabel: event.target.value,
                            }),
                          )
                        }
                        placeholder="e.g. Shop now"
                        className="h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`promo-url-${index}`}>Button URL</Label>
                      <Input
                        id={`promo-url-${index}`}
                        value={item.buttonUrl}
                        onChange={(event) =>
                          onChange(
                            updateItem(values, index, {
                              buttonUrl: event.target.value,
                            }),
                          )
                        }
                        placeholder="/categories/serums or https://…"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}
