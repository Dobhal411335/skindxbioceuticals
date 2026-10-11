"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GalleryItemForm } from "@/components/gallery/gallery-item-form";
import { GalleryItemsGrid } from "@/components/gallery/gallery-items-grid";
import { GalleryUploadPanel } from "@/components/gallery/gallery-upload-panel";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toGalleryItemPayload,
  validateGalleryItemForm,
  type GalleryItemFormErrors,
} from "@/schemas/gallery-schema";
import {
  deleteGalleryItem,
  fetchGalleryItems,
  patchGalleryItem,
  updateGalleryItem,
} from "@/services/api/gallery";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  GalleryItemDto,
  GalleryItemFormValues,
  GalleryPendingUpload,
} from "@/types/gallery";

function createEmptyFormValues(): GalleryItemFormValues {
  return {
    mediaType: "image",
    mediaUrl: "",
    mediaPublicId: "",
    active: true,
  };
}

function dtoToFormValues(item: GalleryItemDto): GalleryItemFormValues {
  return {
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    mediaPublicId: item.mediaPublicId,
    active: item.active,
  };
}

export function GalleryPage({ siteCode }: { siteCode: SiteCode }) {
  const [items, setItems] = useState<GalleryItemDto[]>([]);
  const [values, setValues] = useState<GalleryItemFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<GalleryItemFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryItemDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<GalleryPendingUpload[]>(
    [],
  );
  const pendingUploadsRef = useRef(pendingUploads);
  pendingUploadsRef.current = pendingUploads;

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchGalleryItems(siteCode);
      setItems(data);
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load gallery",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load gallery",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site gallery.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gallery fetch
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      for (const pending of pendingUploadsRef.current) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, []);

  const handleQueuePending = (queued: GalleryPendingUpload[]) => {
    setPendingUploads((prev) => [...queued, ...prev]);
  };

  const handlePendingComplete = (id: string) => {
    setPendingUploads((prev) => {
      const finishing = prev.find((entry) => entry.id === id);
      if (finishing) {
        URL.revokeObjectURL(finishing.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const resetForm = () => {
    setValues(createEmptyFormValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    const validation = validateGalleryItemForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toGalleryItemPayload(validation.data);
      await updateGalleryItem(siteCode, editingId, payload);
      showSuccess("Gallery item updated");
      resetForm();
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save gallery item",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: GalleryItemDto) => {
    setEditingId(item.id);
    setValues(dtoToFormValues(item));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item: GalleryItemDto) => {
    setIsDeleting(true);
    try {
      await deleteGalleryItem(siteCode, item.id);
      showSuccess("Gallery item deleted");
      if (editingId === item.id) {
        resetForm();
      }
      setPendingDelete(null);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to delete gallery item",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: GalleryItemDto) => {
    try {
      await patchGalleryItem(siteCode, item.id, { active: !item.active });
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update item visibility",
      );
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Gallery Section"
      description="Manage lookbook images and short videos for the storefront."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Gallery Section
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped media for {siteCode === "IN" ? ".in" : ".com"} homepage
            lookbook.
          </p>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load gallery</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-8">
          <GalleryUploadPanel
            siteCode={siteCode}
            onQueuePending={handleQueuePending}
            onPendingComplete={handlePendingComplete}
            onUploaded={load}
          />

          <GalleryItemForm
            siteCode={siteCode}
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            isEditing={Boolean(editingId)}
            editingId={editingId}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
            onReset={resetForm}
          />

          {isLoading && pendingUploads.length === 0 ? (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/40" />
          ) : (
            <GalleryItemsGrid
              items={items}
              pendingUploads={pendingUploads}
              pendingDeleteId={pendingDelete?.id ?? null}
              isDeleting={isDeleting}
              onEdit={handleEdit}
              onRequestDelete={(item) => setPendingDelete(item)}
              onCancelDelete={() => setPendingDelete(null)}
              onConfirmDelete={(item) => void handleDelete(item)}
              onToggleActive={(item) => void handleToggleActive(item)}
            />
          )}
        </div>
      </div>
    </AdminAppShell>
  );
}
