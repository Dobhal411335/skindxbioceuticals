"use client";

import {
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  BookOpenText,
  ImagePlus,
  Layers3,
  Megaphone,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import {
  createEmptyAboutCard,
  createEmptyHighlightItem,
  createEmptyTextSlide,
} from "@/components/about-us-banner/about-us-banner-form-utils";
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
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/lib/toast";
import type { AboutUsBannerFormErrors } from "@/schemas/about-us-banner-schema";
import { uploadAboutUsImage } from "@/services/api/about-us-banner";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  AboutUsAboutCardFormValues,
  AboutUsBannerFormValues,
  AboutUsHighlightItemFormValues,
  AboutUsTextSlideFormValues,
} from "@/types/about-us-banner";

type AboutUsBannerFormProps = {
  siteCode: SiteCode;
  recordId: string | null;
  values: AboutUsBannerFormValues;
  errors: AboutUsBannerFormErrors;
  onChange: Dispatch<SetStateAction<AboutUsBannerFormValues>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formId?: string;
};

function ImageField({
  label,
  url,
  uploading,
  onPick,
  onClear,
  inputRef,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onPick: () => void;
  onClear: () => void;
  inputRef: (node: HTMLInputElement | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {url ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of Cloudinary URL */}
          <img src={url} alt="" className="h-36 w-full object-cover" />
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
          disabled={uploading}
          onClick={onPick}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
        {url ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
      />
    </div>
  );
}

export function AboutUsBannerForm({
  siteCode,
  recordId,
  values,
  errors,
  onChange,
  onSubmit,
  formId = "about-us-banner-form",
}: AboutUsBannerFormProps) {
  const aboutFileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const highlightFileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [uploadingKey, setUploadingKey] = useState("");

  const updateAboutCard = (
    index: number,
    patch: Partial<AboutUsAboutCardFormValues>,
  ) => {
    onChange((prev) => ({
      ...prev,
      aboutCards: prev.aboutCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...patch } : card,
      ),
    }));
  };

  const updateHighlight = (
    index: number,
    patch: Partial<AboutUsHighlightItemFormValues>,
  ) => {
    onChange((prev) => ({
      ...prev,
      highlightItems: prev.highlightItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const updateTextSlide = (
    index: number,
    patch: Partial<AboutUsTextSlideFormValues>,
  ) => {
    onChange((prev) => ({
      ...prev,
      textSlides: prev.textSlides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, ...patch } : slide,
      ),
    }));
  };

  const handleUpload = async (
    kind: "about" | "highlight",
    index: number,
    file: File | undefined,
  ) => {
    if (!file) return;
    const key = `${kind}-${index}`;
    setUploadingKey(key);
    try {
      const uploaded = await uploadAboutUsImage(siteCode, file, recordId);
      if (!uploaded.url) {
        throw new Error("Upload succeeded but no image URL was returned");
      }
      if (kind === "about") {
        updateAboutCard(index, {
          image: { url: uploaded.url, publicId: uploaded.publicId },
        });
      } else {
        updateHighlight(index, {
          image: { url: uploaded.url, publicId: uploaded.publicId },
        });
      }
      showSuccess("Image uploaded successfully");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Cloudinary upload failed");
    } finally {
      setUploadingKey("");
    }
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Section 1 — Top promotional header
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            Eyebrow, heading, subheading, and Shop Now link shown above the About
            split on the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="promo-label">Eyebrow label</Label>
            <Input
              id="promo-label"
              value={values.promoLabel}
              onChange={(event) =>
                onChange({ ...values, promoLabel: event.target.value })
              }
              placeholder="Featured offers"
            />
            {errors.promoLabel ? (
              <p className="text-xs text-destructive">{errors.promoLabel}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="promo-button-label">Button label</Label>
            <Input
              id="promo-button-label"
              value={values.promoButtonLabel}
              onChange={(event) =>
                onChange({ ...values, promoButtonLabel: event.target.value })
              }
              placeholder="Shop now"
            />
            {errors.promoButtonLabel ? (
              <p className="text-xs text-destructive">{errors.promoButtonLabel}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="promo-heading">Heading</Label>
            <Input
              id="promo-heading"
              value={values.promoHeading}
              onChange={(event) =>
                onChange({ ...values, promoHeading: event.target.value })
              }
              placeholder="Curated selections worth a closer look"
            />
            {errors.promoHeading ? (
              <p className="text-xs text-destructive">{errors.promoHeading}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="promo-subheading">Subheading</Label>
            <Textarea
              id="promo-subheading"
              value={values.promoSubheading}
              onChange={(event) =>
                onChange({ ...values, promoSubheading: event.target.value })
              }
              placeholder="Explore seasonal highlights while stocks last."
              rows={3}
            />
            {errors.promoSubheading ? (
              <p className="text-xs text-destructive">{errors.promoSubheading}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="promo-button-url">Button URL</Label>
            <Input
              id="promo-button-url"
              value={values.promoButtonUrl}
              onChange={(event) =>
                onChange({ ...values, promoButtonUrl: event.target.value })
              }
              placeholder="/shop"
            />
            {errors.promoButtonUrl ? (
              <p className="text-xs text-destructive">{errors.promoButtonUrl}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 2 — About cards carousel
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Split cards with image, copy, and CTA. Multiple active cards
                rotate as a carousel on the storefront.
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
                  aboutCards: [...values.aboutCards, createEmptyAboutCard()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.aboutCards ? (
            <p className="text-xs text-destructive">{errors.aboutCards}</p>
          ) : null}
          {values.aboutCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No about cards yet. Add one to show the About Us split section.
            </p>
          ) : null}
          {values.aboutCards.map((card, index) => (
            <div
              key={`about-card-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Card {index + 1}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={card.active}
                      onCheckedChange={(checked) =>
                        updateAboutCard(index, { active: checked })
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
                      onChange({
                        ...values,
                        aboutCards: values.aboutCards.filter(
                          (_, cardIndex) => cardIndex !== index,
                        ),
                      })
                    }
                    aria-label={`Remove about card ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <ImageField
                  label="Image"
                  url={card.image.url}
                  uploading={uploadingKey === `about-${index}`}
                  onPick={() => aboutFileRefs.current[index]?.click()}
                  onClear={() =>
                    updateAboutCard(index, { image: { url: "", publicId: "" } })
                  }
                  inputRef={(node) => {
                    aboutFileRefs.current[index] = node;
                    if (node) {
                      node.onchange = (event) => {
                        const target = event.target as HTMLInputElement;
                        void handleUpload("about", index, target.files?.[0]);
                        target.value = "";
                      };
                    }
                  }}
                />
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`about-${index}-label`}>Label</Label>
                    <Input
                      id={`about-${index}-label`}
                      value={card.label}
                      onChange={(event) =>
                        updateAboutCard(index, { label: event.target.value })
                      }
                      placeholder="About us"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`about-${index}-heading`}>Heading</Label>
                    <Input
                      id={`about-${index}-heading`}
                      value={card.heading}
                      onChange={(event) =>
                        updateAboutCard(index, { heading: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`about-${index}-description`}>
                      Description
                    </Label>
                    <Textarea
                      id={`about-${index}-description`}
                      value={card.description}
                      onChange={(event) =>
                        updateAboutCard(index, {
                          description: event.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`about-${index}-button-label`}>
                        Button label
                      </Label>
                      <Input
                        id={`about-${index}-button-label`}
                        value={card.buttonLabel}
                        onChange={(event) =>
                          updateAboutCard(index, {
                            buttonLabel: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`about-${index}-button-url`}>
                        Button URL
                      </Label>
                      <Input
                        id={`about-${index}-button-url`}
                        value={card.buttonUrl}
                        onChange={(event) =>
                          updateAboutCard(index, {
                            buttonUrl: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
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
                <BookOpenText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 3A — Highlight cards carousel
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Image cards with heading and link only (no invented blog
                metadata).
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
                  highlightItems: [
                    ...values.highlightItems,
                    createEmptyHighlightItem(),
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.highlightItems ? (
            <p className="text-xs text-destructive">{errors.highlightItems}</p>
          ) : null}
          {values.highlightItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No highlight items yet.
            </p>
          ) : null}
          {values.highlightItems.map((item, index) => (
            <div
              key={`highlight-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Item {index + 1}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        updateHighlight(index, { active: checked })
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
                      onChange({
                        ...values,
                        highlightItems: values.highlightItems.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    aria-label={`Remove highlight ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <ImageField
                  label="Image"
                  url={item.image.url}
                  uploading={uploadingKey === `highlight-${index}`}
                  onPick={() => highlightFileRefs.current[index]?.click()}
                  onClear={() =>
                    updateHighlight(index, { image: { url: "", publicId: "" } })
                  }
                  inputRef={(node) => {
                    highlightFileRefs.current[index] = node;
                    if (node) {
                      node.onchange = (event) => {
                        const target = event.target as HTMLInputElement;
                        void handleUpload("highlight", index, target.files?.[0]);
                        target.value = "";
                      };
                    }
                  }}
                />
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`highlight-${index}-heading`}>Heading</Label>
                    <Input
                      id={`highlight-${index}-heading`}
                      value={item.heading}
                      onChange={(event) =>
                        updateHighlight(index, { heading: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`highlight-${index}-button-label`}>
                        Button label
                      </Label>
                      <Input
                        id={`highlight-${index}-button-label`}
                        value={item.buttonLabel}
                        onChange={(event) =>
                          updateHighlight(index, {
                            buttonLabel: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`highlight-${index}-button-url`}>
                        Button URL
                      </Label>
                      <Input
                        id={`highlight-${index}-button-url`}
                        value={item.buttonUrl}
                        onChange={(event) =>
                          updateHighlight(index, {
                            buttonUrl: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
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
                <BookOpenText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  Section 3B — Text carousel
                </CardTitle>
              </div>
              <CardDescription className="mt-1">
                Heading and subheading pairs shown beside the highlight cards.
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
                  textSlides: [...values.textSlides, createEmptyTextSlide()],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add slide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {errors.textSlides ? (
            <p className="text-xs text-destructive">{errors.textSlides}</p>
          ) : null}
          {values.textSlides.length === 0 ? (
            <p className="text-sm text-muted-foreground">No text slides yet.</p>
          ) : null}
          {values.textSlides.map((slide, index) => (
            <div
              key={`text-slide-${index}`}
              className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Slide {index + 1}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slide.active}
                      onCheckedChange={(checked) =>
                        updateTextSlide(index, { active: checked })
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
                      onChange({
                        ...values,
                        textSlides: values.textSlides.filter(
                          (_, slideIndex) => slideIndex !== index,
                        ),
                      })
                    }
                    aria-label={`Remove text slide ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor={`text-${index}-heading`}>Heading</Label>
                  <Input
                    id={`text-${index}-heading`}
                    value={slide.heading}
                    onChange={(event) =>
                      updateTextSlide(index, { heading: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`text-${index}-subheading`}>Subheading</Label>
                  <Textarea
                    id={`text-${index}-subheading`}
                    value={slide.subheading}
                    onChange={(event) =>
                      updateTextSlide(index, { subheading: event.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}
