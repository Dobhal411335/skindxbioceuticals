"use client";

import { useCallback, useEffect, useState } from "react";

import { CustomerReviewForm } from "@/components/customer-review/customer-review-form";
import { CustomerReviewTable } from "@/components/customer-review/customer-review-table";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toCustomerReviewPayload,
  validateCustomerReviewForm,
  type CustomerReviewFormErrors,
} from "@/schemas/customer-review-schema";
import {
  createCustomerReview,
  deleteCustomerReview,
  fetchCustomerReviews,
  patchCustomerReview,
  updateCustomerReview,
} from "@/services/api/customer-review";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  CustomerReviewDto,
  CustomerReviewFormValues,
} from "@/types/customer-review";

function createEmptyFormValues(): CustomerReviewFormValues {
  return {
    customerName: "",
    designation: "",
    description: "",
    rating: 5,
    imageUrl: "",
    imagePublicId: "",
    active: true,
    order: "",
  };
}

function dtoToFormValues(review: CustomerReviewDto): CustomerReviewFormValues {
  return {
    customerName: review.customerName,
    designation: review.designation,
    description: review.description,
    rating: review.rating,
    imageUrl: review.imageUrl,
    imagePublicId: review.imagePublicId,
    active: review.active,
    order: String(review.order ?? ""),
  };
}

export function CustomerReviewPage({ siteCode }: { siteCode: SiteCode }) {
  const [reviews, setReviews] = useState<CustomerReviewDto[]>([]);
  const [values, setValues] = useState<CustomerReviewFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<CustomerReviewFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerReviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCustomerReviews(siteCode);
      setReviews(data);
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load customer reviews",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load customer reviews",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site customer reviews.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- customer reviews fetch
    void load();
  }, [load]);

  const resetForm = () => {
    setValues(createEmptyFormValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCustomerReviewForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toCustomerReviewPayload(validation.data, reviews.length + 1);
      if (editingId) {
        await updateCustomerReview(siteCode, editingId, payload);
        showSuccess("Customer review updated");
      } else {
        await createCustomerReview(siteCode, payload);
        showSuccess("Customer review added");
      }
      resetForm();
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save customer review",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (review: CustomerReviewDto) => {
    setEditingId(review.id);
    setValues(dtoToFormValues(review));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (review: CustomerReviewDto) => {
    try {
      await deleteCustomerReview(siteCode, review.id);
      showSuccess("Customer review deleted");
      if (editingId === review.id) {
        resetForm();
      }
      setPendingDelete(null);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete customer review",
      );
    }
  };

  const handleToggleActive = async (review: CustomerReviewDto) => {
    try {
      await patchCustomerReview(siteCode, review.id, { active: !review.active });
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update review visibility",
      );
    }
  };

  const handleMove = async (review: CustomerReviewDto, direction: "up" | "down") => {
    const sorted = [...reviews].sort(
      (left, right) => (left.order || 0) - (right.order || 0),
    );
    const index = sorted.findIndex((item) => item.id === review.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const other = sorted[swapIndex]!;
    try {
      await Promise.all([
        patchCustomerReview(siteCode, review.id, { order: other.order }),
        patchCustomerReview(siteCode, other.id, { order: review.order }),
      ]);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to reorder reviews",
      );
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Customer Review"
      description="Manage curated customer testimonials shown on the storefront home page."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Customer Reviews
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped testimonials for {siteCode === "IN" ? ".in" : ".com"}.
          </p>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load customer reviews</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {pendingDelete ? (
          <Alert>
            <AlertTitle>Delete review?</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Delete the review from {pendingDelete.customerName}? This cannot be undone.
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete(pendingDelete)}
                >
                  Delete
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-8">
          <CustomerReviewForm
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

          {isLoading ? (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/40" />
          ) : (
            <CustomerReviewTable
              reviews={reviews}
              onEdit={handleEdit}
              onDelete={(review) => setPendingDelete(review)}
              onToggleActive={(review) => void handleToggleActive(review)}
              onMove={(review, direction) => void handleMove(review, direction)}
            />
          )}
        </div>
      </div>
    </AdminAppShell>
  );
}
