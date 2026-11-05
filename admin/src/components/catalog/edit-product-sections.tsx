"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Star, Trash2, UploadCloud, X } from "lucide-react";

import { ColorManagementSection } from "@/components/catalog/edit-product-colors";
import {
  CouponCurrentTable,
  PdfsCurrentTable,
  ReviewsCurrentTable,
  STANDARD_SIZE_LABELS,
  SizesCurrentTable,
  TagsCurrentTable,
  VariantsCurrentTable,
  VideosCurrentTable,
} from "@/components/catalog/edit-product-section-tables";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { isEmptyRichTextHtml } from "@/lib/tiptap/extensions";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";
import { ApiError } from "@/services/api/errors";
import {
  clearProductTax,
  createCatalogTag,
  createProductEditorialReview,
  deleteProductCloudinaryImages,
  deleteProductEditorialReview,
  updateProductCoupon,
  updateProductDescription,
  updateProductEditorialReview,
  updateProductGallery,
  updateProductHighlights,
  updateProductInfo,
  updateProductPdfs,
  updateProductSizes,
  updateProductTags,
  updateProductTax,
  updateProductVariants,
  updateProductVideos,
  uploadProductImage,
  uploadProductPdf,
} from "@/services/api/product-edit";
import type { SiteCode } from "@/types/auth";
import type {
  CatalogTagDto,
  CouponOptionDto,
  ProductEditDto,
  ProductEditorialReviewDto,
  ProductPdfDto,
  ProductVariantOfferDto,
  ProductVideoDto,
} from "@/types/product-edit";

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/embed\/([^/]+)/)?.[1] ||
        parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

const NO_COUPON_VALUE = "__none__";

function formatCouponOptionLabel(coupon: CouponOptionDto): string {
  if (coupon.type === "PERCENTAGE") {
    return `${coupon.code} — ${coupon.value}%`;
  }
  if (coupon.type === "FIXED_AMOUNT") {
    return `${coupon.code} — ₹${coupon.value}`;
  }
  return `${coupon.code} — ${coupon.type} ${coupon.value}`;
}

type PendingUpload = {
  id: string;
  previewUrl: string;
};

export { ColorManagementSection };

type SizeTab = "standard" | "custom";

type SectionProps = {
  siteCode: SiteCode;
  productId: string;
  data: ProductEditDto;
  onUpdated: (next: ProductEditDto) => void;
};

function ProductNameField({ name }: { name: string }) {
  return (
    <div className="space-y-2">
      <Label>Product name</Label>
      <Input value={name} disabled readOnly />
    </div>
  );
}

function splitExistingSizes(data: ProductEditDto) {
  const activeLabels = data.sizes
    .filter((s) => s.active)
    .map((s) => s.label);
  const standardSelected = STANDARD_SIZE_LABELS.filter((label) =>
    activeLabels.includes(label),
  );
  const customLabels = data.sizes
    .map((s) => s.label)
    .filter(
      (label) =>
        !(STANDARD_SIZE_LABELS as readonly string[]).includes(label),
    );
  const customSelected = customLabels.filter((label) =>
    activeLabels.includes(label),
  );
  return { standardSelected, customLabels, customSelected };
}

export function SizeManagementSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const initial = splitExistingSizes(data);
  const [sizeTab, setSizeTab] = useState<SizeTab>(
    initial.customSelected.length > 0 && initial.standardSelected.length === 0
      ? "custom"
      : "standard",
  );
  const [standardSelected, setStandardSelected] = useState<string[]>(
    initial.standardSelected,
  );
  const [customLabels, setCustomLabels] = useState<string[]>(
    initial.customLabels,
  );
  const [customSelected, setCustomSelected] = useState<string[]>(
    initial.customSelected,
  );
  const [customInput, setCustomInput] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const [chartUrl, setChartUrl] = useState(data.sizeChart?.url ?? "");
  const [chartPublicId, setChartPublicId] = useState(
    data.sizeChart?.publicId ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applySavedSizes = (next: ProductEditDto) => {
    const split = splitExistingSizes(next);
    setStandardSelected(split.standardSelected);
    setCustomLabels(split.customLabels);
    setCustomSelected(split.customSelected);
    onUpdated(next);
  };

  const persistSizes = async (
    nextStandard: string[],
    nextCustomLabels: string[],
    nextCustomSelected: string[],
    successMessage: string,
  ) => {
    const sizes = [
      ...STANDARD_SIZE_LABELS.filter((label) => nextStandard.includes(label)).map(
        (label, index) => ({
          label,
          active: true,
          sortOrder: index,
        }),
      ),
      ...nextCustomLabels.map((label, index) => ({
        label,
        active: nextCustomSelected.includes(label),
        sortOrder: nextStandard.length + index,
      })),
    ];
    const next = await updateProductSizes(siteCode, productId, {
      sizeChartUrl: chartUrl || null,
      sizeChartPublicId: chartPublicId || null,
      sizes,
    });
    applySavedSizes(next);
    showSuccess(successMessage);
  };

  const toggleStandard = (label: string) => {
    setStandardSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const toggleCustom = (label: string) => {
    setCustomSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if ((STANDARD_SIZE_LABELS as readonly string[]).includes(trimmed)) {
      setStandardSelected((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      setSizeTab("standard");
      setEditingLabel(null);
      setCustomInput("");
      return;
    }
    if (
      trimmed !== editingLabel &&
      customLabels.some((label) => label.toLowerCase() === trimmed.toLowerCase())
    ) {
      showError("That custom size is already added");
      return;
    }
    if (editingLabel) {
      const nextLabels = customLabels.map((label) =>
        label === editingLabel ? trimmed : label,
      );
      const nextSelected = customSelected.map((label) =>
        label === editingLabel ? trimmed : label,
      );
      const wasSaved = data.sizes.some((size) => size.label === editingLabel);
      if (!wasSaved) {
        setCustomLabels(nextLabels);
        setCustomSelected(nextSelected);
        setEditingLabel(null);
        setCustomInput("");
        return;
      }
      setSaving(true);
      void persistSizes(standardSelected, nextLabels, nextSelected, "Size updated")
        .then(() => {
          setEditingLabel(null);
          setCustomInput("");
        })
        .catch((error: unknown) => {
          showError(
            error instanceof ApiError ? error.message : "Failed to update size",
          );
        })
        .finally(() => setSaving(false));
      return;
    }
    if (!customLabels.includes(trimmed)) {
      setCustomLabels((prev) => [...prev, trimmed]);
    }
    if (!customSelected.includes(trimmed)) {
      setCustomSelected((prev) => [...prev, trimmed]);
    }
    setCustomInput("");
  };

  const removeCustom = (label: string) => {
    const nextLabels = customLabels.filter((item) => item !== label);
    const nextSelected = customSelected.filter((item) => item !== label);
    if (editingLabel === label) {
      setEditingLabel(null);
      setCustomInput("");
    }
    const wasSaved = data.sizes.some((size) => size.label === label);
    if (!wasSaved) {
      setCustomLabels(nextLabels);
      setCustomSelected(nextSelected);
      return;
    }
    setDeletingLabel(label);
    setSaving(true);
    void persistSizes(standardSelected, nextLabels, nextSelected, `${label} deleted`)
      .catch((error: unknown) => {
        showError(
          error instanceof ApiError ? error.message : "Failed to delete size",
        );
      })
      .finally(() => {
        setSaving(false);
        setDeletingLabel(null);
      });
  };

  const removeStandard = (label: string) => {
    const nextStandard = standardSelected.filter((item) => item !== label);
    if (editingLabel === label) {
      setEditingLabel(null);
    }
    const wasSaved = data.sizes.some((size) => size.label === label);
    if (!wasSaved) {
      setStandardSelected(nextStandard);
      return;
    }
    setDeletingLabel(label);
    setSaving(true);
    void persistSizes(nextStandard, customLabels, customSelected, `${label} deleted`)
      .catch((error: unknown) => {
        showError(
          error instanceof ApiError ? error.message : "Failed to delete size",
        );
      })
      .finally(() => {
        setSaving(false);
        setDeletingLabel(null);
      });
  };

  const handleDeleteSize = (label: string) => {
    if ((STANDARD_SIZE_LABELS as readonly string[]).includes(label)) {
      removeStandard(label);
      return;
    }
    removeCustom(label);
  };

  const handleEditSize = (label: string) => {
    if ((STANDARD_SIZE_LABELS as readonly string[]).includes(label)) {
      setSizeTab("standard");
      setStandardSelected((prev) =>
        prev.includes(label) ? prev : [...prev, label],
      );
      setEditingLabel(label);
      setCustomInput("");
      return;
    }
    setSizeTab("custom");
    setEditingLabel(label);
    setCustomInput(label);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadProductImage(siteCode, file, productId);
      setChartUrl(uploaded.url);
      setChartPublicId(uploaded.publicId);
      showSuccess("Size chart uploaded");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistSizes(
        standardSelected,
        customLabels,
        customSelected,
        "Sizes saved",
      );
      setEditingLabel(null);
      setCustomInput("");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save sizes",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <p className="text-sm text-muted-foreground">
        Sizes are optional. Skip this section to sell a single base price without
        size options on the storefront.
      </p>
      <div className="space-y-2">
        <Label>Size chart image</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload chart"}
          </Button>
          {chartUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={chartUrl}
              alt="Size chart"
              className="h-24 w-auto rounded border object-contain"
            />
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Sizes (optional)</Label>
        <div
          role="tablist"
          aria-label="Size input mode"
          className="inline-flex rounded-lg border border-border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={sizeTab === "standard"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              sizeTab === "standard"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSizeTab("standard")}
          >
            S / M / L
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sizeTab === "custom"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              sizeTab === "custom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSizeTab("custom")}
          >
            Custom size
          </button>
        </div>

        {sizeTab === "standard" ? (
          <div role="tabpanel" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Select the standard sizes available for this product.
            </p>
            {editingLabel &&
            (STANDARD_SIZE_LABELS as readonly string[]).includes(editingLabel) ? (
              <p className="text-sm text-muted-foreground">
                Updating {editingLabel}. Change the fixed sizes, then save.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {STANDARD_SIZE_LABELS.map((label) => (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant={
                    standardSelected.includes(label) ? "default" : "outline"
                  }
                  onClick={() => toggleStandard(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div role="tabpanel" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add product-specific sizes (for example 30ml, Free size).
            </p>
            <div className="flex gap-2">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={
                  editingLabel ? `Update ${editingLabel}` : "Custom size (e.g. 30ml)"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
              />
              <Button type="button" variant="secondary" disabled={saving} onClick={addCustom}>
                {editingLabel ? "Update" : "Add"}
              </Button>
              {editingLabel ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingLabel(null);
                    setCustomInput("");
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
            {customLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customLabels.map((label) => (
                    <Badge
                      key={label}
                      variant={customSelected.includes(label) ? "default" : "outline"}
                      className="h-7 gap-1 px-2.5"
                    >
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => toggleCustom(label)}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${label}`}
                        disabled={saving || deletingLabel === label}
                        className="inline-flex cursor-pointer rounded-full opacity-80 hover:opacity-100 disabled:cursor-not-allowed"
                        onClick={() => removeCustom(label)}
                      >
                        <X aria-hidden />
                      </button>
                    </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No custom sizes yet for this product.
              </p>
            )}
          </div>
        )}

        {(standardSelected.length > 0 || customSelected.length > 0) && (
          <p className="text-xs text-muted-foreground">
            Selected:{" "}
            {[...standardSelected, ...customSelected].join(", ") || "none"}
          </p>
        )}
      </div>

      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving…" : "Save sizes"}
      </Button>

      <SizesCurrentTable
        data={data}
        mode={sizeTab}
        editingLabel={editingLabel}
        deletingLabel={deletingLabel}
        onEdit={handleEditSize}
        onDelete={handleDeleteSize}
      />
    </div>
  );
}

type VariantDraft = {
  id?: string;
  sizeLabel: string;
  colorLabel: string;
  price: string;
  vendorPrice: string;
  quantity: string;
  weightGrams: string;
  profileImage: { url: string; publicId: string } | null;
  subImages: Array<{ url: string; publicId: string }>;
  isActive: boolean;
};

const EMPTY_VARIANT_DRAFT: VariantDraft = {
  sizeLabel: "",
  colorLabel: "",
  price: "",
  vendorPrice: "",
  quantity: "",
  weightGrams: "",
  profileImage: null,
  subImages: [],
  isActive: true,
};

function variantOfferToDraft(offer: ProductVariantOfferDto): VariantDraft {
  return {
    id: offer.id,
    sizeLabel: offer.sizeLabel ?? "",
    colorLabel: offer.colorLabel ?? "",
    price: String(offer.price),
    vendorPrice: offer.vendorPrice != null ? String(offer.vendorPrice) : "",
    quantity: String(offer.quantity),
    weightGrams: offer.weightGrams != null ? String(offer.weightGrams) : "",
    profileImage: offer.profileImage,
    subImages: offer.subImages,
    isActive: offer.isActive,
  };
}

function variantOfferToPayload(offer: ProductVariantOfferDto) {
  return {
    id: offer.id,
    sizeLabel: offer.sizeLabel,
    colorLabel: offer.colorLabel,
    price: offer.price,
    vendorPrice: offer.vendorPrice,
    quantity: offer.quantity,
    weightGrams: offer.weightGrams,
    isActive: offer.isActive,
    profileImage: offer.profileImage,
    subImages: offer.subImages,
  };
}

function draftToPayload(draft: VariantDraft) {
  return {
    id: draft.id,
    sizeLabel: draft.sizeLabel || null,
    colorLabel: draft.colorLabel || null,
    price: Number(draft.price) || 0,
    vendorPrice: draft.vendorPrice === "" ? null : Number(draft.vendorPrice),
    quantity: Number(draft.quantity) || 0,
    weightGrams: draft.weightGrams === "" ? null : Number(draft.weightGrams),
    isActive: draft.isActive,
    profileImage: draft.profileImage,
    subImages: draft.subImages,
  };
}

function sizeSelectOptions(
  data: ProductEditDto,
  currentLabel: string,
): string[] {
  const labels = data.sizes
    .filter((size) => size.active || size.label === currentLabel)
    .map((size) => size.label);
  if (currentLabel && !labels.includes(currentLabel)) {
    labels.push(currentLabel);
  }
  return labels;
}

function colorSelectOptions(
  data: ProductEditDto,
  currentName: string,
): Array<{ value: string; name: string; hex: string | null }> {
  const options = data.colors
    .filter((color) => color.active || color.name === currentName)
    .map((color) => ({
      value: `${color.id}:${color.name}:${color.hex ?? ""}`,
      name: color.name,
      hex: color.hex,
    }));
  if (currentName && !options.some((option) => option.name === currentName)) {
    options.push({ value: currentName, name: currentName, hex: null });
  }
  return options;
}

export function QuantityManagementSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const profileFileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<VariantDraft>(EMPTY_VARIANT_DRAFT);
  const [draftEpoch, setDraftEpoch] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sizeOptions = sizeSelectOptions(data, draft.sizeLabel);
  const colorOptions = colorSelectOptions(data, draft.colorLabel);
  const hasSizeOptions = data.sizes.some((size) => size.active) || sizeOptions.length > 0;
  const hasColorOptions =
    data.colors.some((color) => color.active) || colorOptions.length > 0;
  const isEditing = Boolean(draft.id);
  const patchDraft = (patch: Partial<VariantDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const resetDraft = () => {
    setDraft(EMPTY_VARIANT_DRAFT);
    setDraftEpoch((epoch) => epoch + 1);
  };

  const handleEdit = (variantId: string) => {
    const offer = data.variants.find((row) => row.id === variantId);
    if (!offer) return;
    setDraft(variantOfferToDraft(offer));
  };

  const handleProfileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadProductImage(siteCode, file, productId);
      patchDraft({ profileImage: uploaded });
      showSuccess("Profile image uploaded");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (draft.price === "" || Number.isNaN(Number(draft.price))) {
      showError("Enter a valid price");
      return;
    }
    if (draft.quantity === "" || Number.isNaN(Number(draft.quantity))) {
      showError("Enter a valid quantity");
      return;
    }

    const wasEditing = isEditing;
    setSaving(true);
    try {
      const others = data.variants
        .filter((row) => row.id !== draft.id)
        .map(variantOfferToPayload);
      const next = await updateProductVariants(siteCode, productId, {
        variants: [...others, draftToPayload(draft)],
      });
      onUpdated(next);
      if (wasEditing) {
        resetDraft();
      } else {
        // Keep size/color so another offer with the same attributes stays controlled.
        setDraft((prev) => ({
          ...EMPTY_VARIANT_DRAFT,
          sizeLabel: prev.sizeLabel,
          colorLabel: prev.colorLabel,
        }));
      }
      showSuccess(wasEditing ? "Offer updated" : "Price / quantity saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save offer",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const remaining = data.variants
        .filter((row) => row.id !== pendingDeleteId)
        .map(variantOfferToPayload);
      const next = await updateProductVariants(siteCode, productId, {
        variants: remaining,
      });
      onUpdated(next);
      if (draft.id === pendingDeleteId) {
        resetDraft();
      }
      setPendingDeleteId(null);
      showSuccess("Offer deleted");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete offer",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />

      <div className="space-y-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {isEditing ? "Edit offer" : "Add price / quantity offer"}
          </p>
          {isEditing ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetDraft}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        {!hasSizeOptions && !hasColorOptions ? (
          <p className="text-xs text-muted-foreground">
            No sizes or colors configured — save a single base price and quantity.
            Size and color remain optional.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="offer-size">Size (optional)</Label>
            <Select
              key={`offer-size-${draftEpoch}`}
              value={draft.sizeLabel || undefined}
              onValueChange={(value) => patchDraft({ sizeLabel: value })}
              disabled={!hasSizeOptions}
            >
              <SelectTrigger id="offer-size" className="w-full">
                <SelectValue
                  placeholder={
                    hasSizeOptions
                      ? "Select size (optional)"
                      : "No sizes — base offer"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasSizeOptions ? (
              <p className="text-xs text-muted-foreground">
                Optional. Add sizes in Size Management if this product needs them.
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="offer-color">Color (optional)</Label>
            <Select
              key={`offer-color-${draftEpoch}`}
              value={
                (colorOptions.find((option) => option.name === draft.colorLabel)
                  ?.value ?? draft.colorLabel) || undefined
              }
              onValueChange={(value) =>
                patchDraft({
                  colorLabel:
                    colorOptions.find((option) => option.value === value)?.name ??
                    value,
                })
              }
              disabled={!hasColorOptions}
            >
              <SelectTrigger id="offer-color" className="w-full">
                <SelectValue
                  placeholder={
                    hasColorOptions
                      ? "Select color (optional)"
                      : "No colors — base offer"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.name}
                    {option.hex ? ` (${option.hex})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasColorOptions ? (
              <p className="text-xs text-muted-foreground">
                Optional. Add colors in Color Management if this product needs them.
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="offer-price">Price (INR) *</Label>
            <Input
              id="offer-price"
              type="number"
              min={0}
              value={draft.price}
              onChange={(e) => patchDraft({ price: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="offer-vendor-price">Vendor price</Label>
            <Input
              id="offer-vendor-price"
              type="number"
              min={0}
              value={draft.vendorPrice}
              onChange={(e) => patchDraft({ vendorPrice: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="offer-quantity">Quantity</Label>
            <Input
              id="offer-quantity"
              type="number"
              min={0}
              value={draft.quantity}
              onChange={(e) => patchDraft({ quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="offer-weight">Weight (g)</Label>
            <Input
              id="offer-weight"
              type="number"
              min={0}
              value={draft.weightGrams}
              onChange={(e) => patchDraft({ weightGrams: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Profile image</Label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="space-y-2">
              <input
                ref={profileFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleProfileUpload(e)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => profileFileRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {uploading ? "Uploading…" : "Upload image"}
              </Button>
              {draft.profileImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => patchDraft({ profileImage: null })}
                >
                  Remove image
                </Button>
              ) : null}
            </div>
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
              {draft.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.profileImage.url}
                  alt="Offer profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="px-3 text-center text-xs text-muted-foreground">
                  No profile image yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saving || uploading}
            onClick={() => void handleSave()}
          >
            {saving
              ? "Saving…"
              : isEditing
                ? "Update Product Price"
                : "Save Product Price"}
          </Button>
          {isEditing ? (
            <Button type="button" variant="outline" onClick={resetDraft}>
              Cancel edit
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={resetDraft}>
              Clear form
            </Button>
          )}
        </div>
      </div>

      <VariantsCurrentTable
        data={data}
        editingId={draft.id ?? null}
        deletingId={deleting ? pendingDeleteId : null}
        onEdit={handleEdit}
        onDelete={(variantId) => setPendingDeleteId(variantId)}
      />

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setPendingDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Product Price?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product price. Prices already referenced
              by a cart or order are deactivated instead of hard-deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete Product Price"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CouponSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [couponId, setCouponId] = useState(
    data.coupon?.couponId ?? NO_COUPON_VALUE,
  );
  const [saving, setSaving] = useState(false);

  const couponOptions: CouponOptionDto[] = (() => {
    const options = [...data.availableCoupons];
    if (
      data.coupon &&
      !options.some((coupon) => coupon.id === data.coupon?.couponId)
    ) {
      options.unshift({
        id: data.coupon.couponId,
        code: data.coupon.code,
        type: data.coupon.type,
        value: data.coupon.value,
        isActive: true,
      });
    }
    return options;
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductCoupon(siteCode, productId, {
        couponId: couponId === NO_COUPON_VALUE ? null : couponId,
      });
      onUpdated(next);
      setCouponId(next.coupon?.couponId ?? NO_COUPON_VALUE);
      showSuccess("Coupon saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save coupon",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <div className="space-y-2">
        <Label htmlFor="coupon-select">Discount coupon</Label>
        <Select
          value={couponId}
          onValueChange={(value) => {
            if (value) setCouponId(value);
          }}
        >
          <SelectTrigger id="coupon-select" className="w-full max-w-md">
            <SelectValue placeholder="Select a coupon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_COUPON_VALUE}>No coupon</SelectItem>
            {couponOptions.map((coupon) => (
              <SelectItem key={coupon.id} value={coupon.id}>
                {formatCouponOptionLabel(coupon)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.availableCoupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active coupons yet. Create coupons under Marketing → Create Coupon
            Code.
          </p>
        ) : null}
      </div>
      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving…" : "Save coupon"}
      </Button>
      <CouponCurrentTable data={data} />
    </div>
  );
}

export function TaxSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [cgst, setCgst] = useState(String(data.tax?.cgst ?? 0));
  const [sgst, setSgst] = useState(String(data.tax?.sgst ?? 0));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductTax(siteCode, productId, {
        cgst: Number(cgst) || 0,
        sgst: Number(sgst) || 0,
      });
      onUpdated(next);
      showSuccess("Tax saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save tax",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const next = await clearProductTax(siteCode, productId);
      onUpdated(next);
      setCgst("0");
      setSgst("0");
      showSuccess("Tax cleared");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to clear tax",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>CGST %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={cgst}
            onChange={(e) => setCgst(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>SGST %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={sgst}
            onChange={(e) => setSgst(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save tax"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving || !data.tax}
          onClick={() => void handleClear()}
        >
          Clear tax
        </Button>
      </div>
    </div>
  );
}

export function GallerySection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [banner, setBanner] = useState<{
    imageUrl: string;
    imagePublicId: string;
  } | null>(
    data.banner
      ? { imageUrl: data.banner.url, imagePublicId: data.banner.publicId }
      : null,
  );
  const [bannerPending, setBannerPending] = useState<PendingUpload | null>(
    null,
  );
  const [images, setImages] = useState(
    data.gallery.map((img) => ({
      imageUrl: img.imageUrl,
      imagePublicId: img.imagePublicId,
      isPrimary: img.isPrimary,
    })),
  );
  const [galleryPending, setGalleryPending] = useState<PendingUpload[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const destroyCloudinary = async (publicId: string | null | undefined) => {
    if (!publicId?.trim()) return;
    await deleteProductCloudinaryImages([publicId.trim()]);
  };

  const handleBannerUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const pendingId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setBannerPending({ id: pendingId, previewUrl });
    try {
      const uploaded = await uploadProductImage(siteCode, file, productId);
      const previousPublicId = banner?.imagePublicId;
      setBanner({
        imageUrl: uploaded.url,
        imagePublicId: uploaded.publicId,
      });
      if (previousPublicId && previousPublicId !== uploaded.publicId) {
        try {
          await destroyCloudinary(previousPublicId);
        } catch {
          // Best-effort cleanup of the replaced banner.
        }
      }
      showSuccess("Logo / banner uploaded");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setBannerPending(null);
      event.target.value = "";
    }
  };

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    const pending = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      file,
    }));
    setGalleryPending(
      pending.map(({ id, previewUrl }) => ({ id, previewUrl })),
    );

    try {
      const uploaded: Array<{ url: string; publicId: string }> = [];
      for (const item of pending) {
        uploaded.push(await uploadProductImage(siteCode, item.file, productId));
      }
      setImages((prev) => [
        ...prev,
        ...uploaded.map((img, index) => ({
          imageUrl: img.url,
          imagePublicId: img.publicId,
          isPrimary: prev.length === 0 && index === 0,
        })),
      ]);
      showSuccess(
        uploaded.length === 1 ? "Image uploaded" : "Images uploaded",
      );
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      for (const item of pending) {
        URL.revokeObjectURL(item.previewUrl);
      }
      setGalleryPending([]);
      event.target.value = "";
    }
  };

  const handleDeleteBanner = async () => {
    if (!banner) return;
    const publicId = banner.imagePublicId;
    setDeletingPublicId(publicId || "__banner__");
    setBanner(null);
    try {
      await destroyCloudinary(publicId);
      showSuccess("Logo / banner removed");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Removed from form, but Cloudinary delete failed",
      );
    } finally {
      setDeletingPublicId(null);
    }
  };

  const handleDeleteGalleryImage = async (index: number) => {
    const target = images[index];
    if (!target) return;
    const publicId = target.imagePublicId;
    setDeletingPublicId(publicId || `gallery-${index}`);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (target.isPrimary && next.length > 0) {
        return next.map((row, i) => ({ ...row, isPrimary: i === 0 }));
      }
      return next;
    });
    try {
      await destroyCloudinary(publicId);
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Removed from form, but Cloudinary delete failed",
      );
    } finally {
      setDeletingPublicId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductGallery(siteCode, productId, {
        bannerUrl: banner?.imageUrl ?? null,
        bannerPublicId: banner?.imagePublicId ?? null,
        images: images.map((img, index) => ({ ...img, sortOrder: index })),
      });
      onUpdated(next);
      setBanner(
        next.banner
          ? {
              imageUrl: next.banner.url,
              imagePublicId: next.banner.publicId,
            }
          : null,
      );
      setImages(
        next.gallery.map((img) => ({
          imageUrl: img.imageUrl,
          imagePublicId: img.imagePublicId,
          isPrimary: img.isPrimary,
        })),
      );
      showSuccess("Gallery saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save gallery",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploading = Boolean(bannerPending) || galleryPending.length > 0;

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />

      <div className="space-y-3">
        <Label>Logo / banner image</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleBannerUpload(e)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => bannerInputRef.current?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {bannerPending ? "Uploading…" : "Upload logo / banner"}
          </Button>
        </div>
        <div className="grid max-w-md grid-cols-1 gap-3">
          {bannerPending ? (
            <div
              className="relative aspect-[2/1] overflow-hidden rounded-xl border border-dashed border-border bg-muted/20"
              aria-busy="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerPending.previewUrl}
                alt=""
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55">
                <Loader2 className="size-8 animate-spin" aria-hidden />
                <p className="text-xs font-medium">Uploading…</p>
              </div>
            </div>
          ) : null}
          {banner && !bannerPending ? (
            <div className="group relative aspect-[2/1] overflow-hidden rounded-xl border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-2 opacity-0 transition-opacity group-hover:bg-black/25 group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  disabled={deletingPublicId === (banner.imagePublicId || "__banner__")}
                  onClick={() => void handleDeleteBanner()}
                  aria-label="Delete logo / banner"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Product gallery</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleGalleryUpload(e)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => galleryInputRef.current?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {galleryPending.length > 0 ? "Uploading…" : "Upload gallery images"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {galleryPending.map((pending) => (
            <div
              key={pending.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-border bg-muted/20"
              aria-busy="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.previewUrl}
                alt=""
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55">
                <Loader2 className="size-7 animate-spin" aria-hidden />
                <p className="text-xs font-medium">Uploading…</p>
              </div>
            </div>
          ))}
          {images.map((img, index) => (
            <div
              key={img.imagePublicId || img.imageUrl}
              className="group space-y-2"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-2 opacity-0 transition-opacity group-hover:bg-black/25 group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    disabled={
                      deletingPublicId ===
                      (img.imagePublicId || `gallery-${index}`)
                    }
                    onClick={() => void handleDeleteGalleryImage(index)}
                    aria-label={`Delete gallery image ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={img.isPrimary}
                  onCheckedChange={(checked) =>
                    setImages((prev) =>
                      prev.map((row, i) => ({
                        ...row,
                        isPrimary: checked ? i === index : false,
                      })),
                    )
                  }
                />
                Primary
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        disabled={saving || uploading}
        onClick={() => void handleSave()}
      >
        {saving ? "Saving…" : "Save gallery"}
      </Button>
    </div>
  );
}

const EMPTY_VIDEO_ROW = { name: "", url: "", description: "" };
const MAX_PRODUCT_PDF_BYTES = 10 * 1024 * 1024;

export function PdfSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfPublicId, setPdfPublicId] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPdfUrl("");
    setPdfPublicId("");
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadPdfIntoForm = (pdf: ProductPdfDto) => {
    setEditingId(pdf.id);
    setName(pdf.name);
    setPdfUrl(pdf.pdfUrl);
    setPdfPublicId(pdf.pdfPublicId);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("Only PDF files are allowed");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PRODUCT_PDF_BYTES) {
      showError("PDF must be 10MB or smaller");
      event.target.value = "";
      return;
    }

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploaded = await uploadProductPdf(siteCode, file, productId);
      setPdfUrl(uploaded.url);
      setPdfPublicId(uploaded.publicId);
      showSuccess("PDF uploaded");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to upload PDF",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError("Enter the PDF name");
      return;
    }
    if (!pdfUrl.trim()) {
      showError("Upload a PDF before saving");
      return;
    }

    const sortedExisting = [...(data.pdfs ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const nextRows = editingId
      ? sortedExisting.map((pdf) =>
          pdf.id === editingId
            ? {
                name: trimmedName,
                pdfUrl,
                pdfPublicId,
              }
            : {
                name: pdf.name,
                pdfUrl: pdf.pdfUrl,
                pdfPublicId: pdf.pdfPublicId,
              },
        )
      : [
          ...sortedExisting.map((pdf) => ({
            name: pdf.name,
            pdfUrl: pdf.pdfUrl,
            pdfPublicId: pdf.pdfPublicId,
          })),
          { name: trimmedName, pdfUrl, pdfPublicId },
        ];

    const wasEditing = Boolean(editingId);
    setSaving(true);
    try {
      const next = await updateProductPdfs(siteCode, productId, {
        pdfs: nextRows.map((pdf, index) => ({
          ...pdf,
          sortOrder: index,
        })),
      });
      onUpdated(next);
      resetForm();
      showSuccess(wasEditing ? "PDF updated" : "PDF saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : wasEditing
            ? "Failed to update PDF"
            : "Failed to save PDF",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pdfId: string) => {
    const remaining = [...(data.pdfs ?? [])]
      .filter((pdf) => pdf.id !== pdfId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pdf, index) => ({
        name: pdf.name,
        pdfUrl: pdf.pdfUrl,
        pdfPublicId: pdf.pdfPublicId,
        sortOrder: index,
      }));

    setDeletingId(pdfId);
    try {
      const next = await updateProductPdfs(siteCode, productId, {
        pdfs: remaining,
      });
      onUpdated(next);
      if (editingId === pdfId) resetForm();
      showSuccess("PDF removed");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to remove PDF",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const previewSrc = localPreviewUrl || pdfUrl;

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />

      <div className="space-y-2">
        <Label htmlFor="product-pdf-name">Enter the PDF name</Label>
        <Input
          id="product-pdf-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Ingredient list"
        />
      </div>

      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Upload PDF</Label>
            <p className="text-xs text-muted-foreground">
              PDF only · max 10MB · stored on Cloudinary
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Select PDF
              </>
            )}
          </Button>
        </div>

        {previewSrc ? (
          <div className="overflow-hidden rounded-md border bg-muted/30">
            <iframe
              title="PDF preview"
              src={previewSrc}
              className="h-56 w-full"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose a PDF to see a small preview here.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving || uploading} onClick={() => void handleSave()}>
          {saving
            ? editingId
              ? "Updating…"
              : "Saving…"
            : editingId
              ? "Update PDF"
              : "Save PDF"}
        </Button>
        {editingId ? (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>

      <PdfsCurrentTable
        siteCode={siteCode}
        data={data}
        editingId={editingId}
        onEdit={loadPdfIntoForm}
        onDelete={(pdfId) => void handleDelete(pdfId)}
        deletingId={deletingId}
      />
    </div>
  );
}

export function VideoSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [videos, setVideos] = useState([{ ...EMPTY_VIDEO_ROW }]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<ProductVideoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setVideos([{ ...EMPTY_VIDEO_ROW }]);
  };

  const loadVideoIntoForm = (video: ProductVideoDto) => {
    setEditingId(video.id);
    setVideos([
      {
        name: video.name,
        url: video.url,
        description: video.description,
      },
    ]);
  };

  const toVideoPayload = (
    rows: Array<{
      name: string;
      url: string;
      description: string;
      sortOrder?: number;
    }>,
  ) =>
    rows.map((video, index) => ({
      name: video.name,
      url: video.url,
      description: isEmptyRichTextHtml(video.description)
        ? ""
        : video.description,
      sortOrder: video.sortOrder ?? index,
    }));

  const handleSave = async () => {
    const draftVideos = videos.filter((v) => v.url.trim() && v.name.trim());
    if (draftVideos.length === 0) {
      showError("Enter a name and URL for at least one video");
      return;
    }

    const sortedExisting = [...data.videos].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    let nextRows: Array<{
      name: string;
      url: string;
      description: string;
    }>;

    if (editingId) {
      const draft = draftVideos[0];
      if (!draft) {
        showError("Enter a name and URL for the video");
        return;
      }
      nextRows = sortedExisting.map((video) =>
        video.id === editingId
          ? {
              name: draft.name,
              url: draft.url,
              description: draft.description,
            }
          : {
              name: video.name,
              url: video.url,
              description: video.description,
            },
      );
    } else {
      nextRows = [
        ...sortedExisting.map((video) => ({
          name: video.name,
          url: video.url,
          description: video.description,
        })),
        ...draftVideos,
      ];
    }

    const wasEditing = Boolean(editingId);
    setSaving(true);
    try {
      const next = await updateProductVideos(siteCode, productId, {
        videos: toVideoPayload(nextRows),
      });
      onUpdated(next);
      resetForm();
      showSuccess(wasEditing ? "Video updated" : "Videos saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : wasEditing
            ? "Failed to update video"
            : "Failed to save videos",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    const remaining = [...data.videos]
      .filter((video) => video.id !== videoId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((video) => ({
        name: video.name,
        url: video.url,
        description: video.description,
      }));

    setDeletingId(videoId);
    try {
      const next = await updateProductVideos(siteCode, productId, {
        videos: toVideoPayload(remaining),
      });
      onUpdated(next);
      if (editingId === videoId) {
        resetForm();
      }
      showSuccess("Video removed");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to remove video",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const uploadInlineImage = async (file: File) => {
    const uploaded = await uploadProductImage(siteCode, file, productId);
    return uploaded.url;
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      {videos.map((video, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={video.name}
                onChange={(e) =>
                  setVideos((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, name: e.target.value } : row,
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Video URL</Label>
              <Input
                value={video.url}
                onChange={(e) =>
                  setVideos((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, url: e.target.value } : row,
                    ),
                  )
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <RichTextEditor
              value={video.description}
              onChange={(html) =>
                setVideos((prev) =>
                  prev.map((row, i) =>
                    i === index ? { ...row, description: html } : row,
                  ),
                )
              }
              placeholder="Video description"
              minHeightClassName="min-h-[120px]"
              onUploadImage={uploadInlineImage}
            />
          </div>
          {!editingId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={videos.length <= 1}
              onClick={() =>
                setVideos((prev) =>
                  prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
                )
              }
            >
              Remove
            </Button>
          ) : null}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {!editingId ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVideos((prev) => [...prev, { ...EMPTY_VIDEO_ROW }])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving
            ? editingId
              ? "Updating…"
              : "Saving…"
            : editingId
              ? "Update video"
              : "Save videos"}
        </Button>
        {editingId ? (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>
      <VideosCurrentTable
        data={data}
        editingId={editingId}
        onEdit={loadVideoIntoForm}
        onView={setViewingVideo}
        onDelete={(videoId) => void handleDelete(videoId)}
        deletingId={deletingId}
      />

      <Dialog
        open={Boolean(viewingVideo)}
        onOpenChange={(open) => {
          if (!open) setViewingVideo(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          {viewingVideo ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewingVideo.name}</DialogTitle>
                <DialogDescription className="truncate">
                  {viewingVideo.url}
                </DialogDescription>
              </DialogHeader>
              {youtubeEmbedUrl(viewingVideo.url) ? (
                <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                  <iframe
                    title={viewingVideo.name}
                    src={youtubeEmbedUrl(viewingVideo.url) ?? undefined}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={viewingVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  Open video URL
                </a>
              )}
              {viewingVideo.description ? (
                <div
                  className="admin-rich-html mt-2 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: viewingVideo.description }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DescriptionSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [description, setDescription] = useState(data.description);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescription(data.description);
  }, [data.description]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductDescription(siteCode, productId, {
        description: isEmptyRichTextHtml(description) ? "" : description,
      });
      onUpdated(next);
      showSuccess("Description saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to save description",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <div className="space-y-2">
        <Label>Product overview description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Overview copy for the product detail page"
          minHeightClassName="min-h-[220px]"
          onUploadImage={async (file) => {
            const uploaded = await uploadProductImage(
              siteCode,
              file,
              productId,
            );
            return uploaded.url;
          }}
        />
      </div>
      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving…" : "Save description"}
      </Button>
    </div>
  );
}

export function InfoSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [sections, setSections] = useState(
    data.infoSections.length > 0
      ? data.infoSections.map((s) => ({ title: s.title, body: s.body }))
      : [{ title: "", body: "" }],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSections(
      data.infoSections.length > 0
        ? data.infoSections.map((s) => ({ title: s.title, body: s.body }))
        : [{ title: "", body: "" }],
    );
  }, [data.infoSections]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductInfo(siteCode, productId, {
        sections: sections
          .filter((s) => s.title.trim() && !isEmptyRichTextHtml(s.body))
          .map((s, index) => ({ ...s, sortOrder: index })),
      });
      onUpdated(next);
      showSuccess("Product information saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save info",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadInlineImage = async (file: File) => {
    const uploaded = await uploadProductImage(siteCode, file, productId);
    return uploaded.url;
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      {sections.map((section, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <Input
              value={section.title}
              onChange={(e) =>
                setSections((prev) =>
                  prev.map((row, i) =>
                    i === index ? { ...row, title: e.target.value } : row,
                  ),
                )
              }
              placeholder="Section heading"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={sections.length <= 1}
              onClick={() =>
                setSections((prev) =>
                  prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
                )
              }
            >
              <Trash2 className="mr-1 h-4 w-4 text-destructive" />
              Delete section
            </Button>
          </div>
          <RichTextEditor
            value={section.body}
            onChange={(html) =>
              setSections((prev) =>
                prev.map((row, i) =>
                  i === index ? { ...row, body: html } : row,
                ),
              )
            }
            placeholder="Section body"
            minHeightClassName="min-h-[140px]"
            onUploadImage={uploadInlineImage}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setSections((prev) => [...prev, { title: "", body: "" }])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save information"}
        </Button>
      </div>
    </div>
  );
}

export function ReviewSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewingReview, setViewingReview] =
    useState<ProductEditorialReviewDto | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setCreatedByName("");
    setTitle("");
    setBody("");
    setImageUrl("");
    setImagePublicId("");
    setRating(5);
  };

  const loadReviewIntoForm = (review: ProductEditorialReviewDto) => {
    setEditingId(review.id);
    setCreatedByName(review.createdByName);
    setRating(review.rating);
    setTitle(review.title);
    setBody(review.body);
    setImageUrl(review.imageUrl ?? "");
    setImagePublicId(review.imagePublicId ?? "");
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadProductImage(siteCode, file, productId);
      setImageUrl(uploaded.url);
      setImagePublicId(uploaded.publicId);
      showSuccess("Review image uploaded");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!createdByName.trim() || isEmptyRichTextHtml(body)) {
      showError("Created by and review body are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        createdByName,
        rating,
        title,
        body,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        active: true,
      };
      const next = editingId
        ? await updateProductEditorialReview(
            siteCode,
            productId,
            editingId,
            payload,
          )
        : await createProductEditorialReview(siteCode, productId, payload);
      onUpdated(next);
      resetForm();
      showSuccess(editingId ? "Review updated" : "Review created");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : editingId
            ? "Failed to update review"
            : "Failed to create review",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const next = await deleteProductEditorialReview(
        siteCode,
        productId,
        reviewId,
      );
      onUpdated(next);
      if (editingId === reviewId) {
        resetForm();
      }
      showSuccess("Review deleted");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete review",
      );
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Created by</Label>
          <Input
            value={createdByName}
            onChange={(e) => setCreatedByName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="p-1"
              >
                <Star
                  className={`h-5 w-5 ${
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title"
      />
      <div className="space-y-1">
        <Label>Review body</Label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="Review body"
          minHeightClassName="min-h-[140px]"
          onUploadImage={async (file) => {
            const uploaded = await uploadProductImage(
              siteCode,
              file,
              productId,
            );
            return uploaded.url;
          }}
        />
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => void handleUpload(e)}
      />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-20 w-20 rounded object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving
            ? "Saving…"
            : editingId
              ? "Update review"
              : "Create review"}
        </Button>
        {editingId ? (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>
      <ReviewsCurrentTable
        data={data}
        editingId={editingId}
        onEdit={loadReviewIntoForm}
        onView={setViewingReview}
        onDelete={(reviewId) => void handleDelete(reviewId)}
      />

      <Dialog
        open={Boolean(viewingReview)}
        onOpenChange={(open) => {
          if (!open) setViewingReview(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {viewingReview ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewingReview.title || "Editorial review"}
                </DialogTitle>
                <DialogDescription>
                  {viewingReview.createdByName} · {viewingReview.rating}/5
                </DialogDescription>
              </DialogHeader>
              <div
                className="admin-rich-html"
                // Admin-only preview of curated HTML; not used on storefront.
                dangerouslySetInnerHTML={{ __html: viewingReview.body }}
              />
              {viewingReview.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewingReview.imageUrl}
                  alt=""
                  className="mt-3 max-h-64 w-auto rounded-lg object-contain"
                />
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TagsSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [catalogTags, setCatalogTags] = useState<CatalogTagDto[]>(
    data.catalogTags,
  );
  const [selectedNames, setSelectedNames] = useState(() =>
    data.tags.map((tag) => tag.name),
  );
  const [selectResetKey, setSelectResetKey] = useState(0);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setCatalogTags(data.catalogTags);
    setSelectedNames(data.tags.map((tag) => tag.name));
  }, [data.catalogTags, data.tags]);

  const isTagSelected = (name: string) =>
    selectedNames.some(
      (selected) => selected.toLowerCase() === name.toLowerCase(),
    );

  const hasSelectableCatalogTags = catalogTags.some(
    (tag) => !isTagSelected(tag.name),
  );

  const addSelectedName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSelectedNames((prev) =>
      prev.some((row) => row.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed],
    );
  };

  const handleSelectTag = (tagId: string) => {
    const tag = catalogTags.find((row) => row.id === tagId);
    if (!tag || isTagSelected(tag.name)) return;
    addSelectedName(tag.name);
    setSelectResetKey((key) => key + 1);
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      showError("Enter a tag name");
      return;
    }
    const existing = catalogTags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      addSelectedName(existing.name);
      setNewTagName("");
      return;
    }
    setCreating(true);
    try {
      const created = await createCatalogTag(siteCode, { name });
      setCatalogTags((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      addSelectedName(created.name);
      setNewTagName("");
      showSuccess("Tag added to catalog");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to create tag",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductTags(siteCode, productId, {
        tagNames: selectedNames,
      });
      onUpdated(next);
      setEditingTagId(null);
      setEditName("");
      showSuccess("Tags saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save tags",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tag: { id: string; name: string }) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditName("");
  };

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      showError("Enter a tag name");
      return;
    }
    if (!editingTagId) return;
    const nextNames = data.tags.map((tag) =>
      tag.id === editingTagId ? trimmed : tag.name,
    );
    setSaving(true);
    try {
      const next = await updateProductTags(siteCode, productId, {
        tagNames: nextNames,
      });
      onUpdated(next);
      setEditingTagId(null);
      setEditName("");
      showSuccess("Tag updated");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to update tag",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    const nextNames = data.tags
      .filter((tag) => tag.id !== tagId)
      .map((tag) => tag.name);
    setDeletingId(tagId);
    try {
      const next = await updateProductTags(siteCode, productId, {
        tagNames: nextNames,
      });
      onUpdated(next);
      if (editingTagId === tagId) {
        setEditingTagId(null);
        setEditName("");
      }
      showSuccess("Tag removed");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to remove tag",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          key={selectResetKey}
          onValueChange={handleSelectTag}
          disabled={catalogTags.length === 0 || !hasSelectableCatalogTags}
        >
          <SelectTrigger
            className="w-full sm:max-w-xs"
            aria-label="Select existing tag"
          >
            <SelectValue
              placeholder={
                catalogTags.length === 0
                  ? "No existing tags"
                  : !hasSelectableCatalogTags
                    ? "All tags already selected"
                    : "Select existing tag"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {catalogTags.map((tag) => {
              const selected = isTagSelected(tag.name);
              return (
                <SelectItem
                  key={tag.id}
                  value={tag.id}
                  disabled={selected}
                >
                  {selected ? `${tag.name} (added)` : tag.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Add new tag"
          className="w-full sm:max-w-xs"
          aria-label="Add new tag"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreateTag();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={creating}
          onClick={() => void handleCreateTag()}
          className="shrink-0"
        >
          {creating ? "Adding…" : "Add"}
        </Button>
      </div>
      {selectedNames.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedNames.map((tag) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setSelectedNames((prev) => prev.filter((row) => row !== tag))
              }
            >
              {tag} ×
            </Button>
          ))}
        </div>
      ) : null}
      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving…" : "Save tags"}
      </Button>
      {editingTagId ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label>Edit tag</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Tag name"
              className="sm:max-w-md"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveEdit()}
              >
                {saving ? "Updating…" : "Update tag"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <TagsCurrentTable
        data={data}
        onEdit={handleEdit}
        onDelete={(tagId) => void handleDelete(tagId)}
        deletingId={deletingId}
        editingId={editingTagId}
      />
    </div>
  );
}

export function HighlightsSection({
  siteCode,
  productId,
  data,
  onUpdated,
}: SectionProps) {
  const [highlights, setHighlights] = useState(
    data.highlights.length > 0
      ? data.highlights.map(({ question, answer }) => ({ question, answer }))
      : [{ question: "", answer: "" }],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHighlights(
      data.highlights.length > 0
        ? data.highlights.map(({ question, answer }) => ({ question, answer }))
        : [{ question: "", answer: "" }],
    );
  }, [data.highlights]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = await updateProductHighlights(siteCode, productId, {
        highlights: highlights
          .map(({ question, answer }) => ({
            question: question.trim(),
            answer: answer.trim(),
          }))
          .filter(({ question, answer }) => question && answer),
      });
      onUpdated(next);
      showSuccess("Highlights saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save highlights",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductNameField name={data.product.name} />
      {highlights.map((highlight, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex gap-2">
            <Input
              value={highlight.question}
              onChange={(e) =>
                setHighlights((prev) =>
                  prev.map((row, i) =>
                    i === index ? { ...row, question: e.target.value } : row,
                  ),
                )
              }
              placeholder={`Question ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={highlights.length <= 1}
              onClick={() =>
                setHighlights((prev) =>
                  prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
                )
              }
              aria-label={`Remove question ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={highlight.answer}
            onChange={(e) =>
              setHighlights((prev) =>
                prev.map((row, i) =>
                  i === index ? { ...row, answer: e.target.value } : row,
                ),
              )
            }
            placeholder="Answer"
            rows={4}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setHighlights((prev) => [...prev, { question: "", answer: "" }])
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add highlight
        </Button>
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save highlights"}
        </Button>
      </div>
    </div>
  );
}
