"use client";

import { useCallback, useEffect, useState } from "react";

import { CouponForm } from "@/components/coupon/coupon-form";
import { CouponTable } from "@/components/coupon/coupon-table";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toCouponPayload,
  validateCouponForm,
  type CouponFormErrors,
} from "@/schemas/coupon-schema";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  patchCoupon,
  updateCoupon,
} from "@/services/api/coupon";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { CouponDto, CouponFormValues } from "@/types/coupon";

function createEmptyFormValues(): CouponFormValues {
  return {
    code: "",
    amount: "",
    percent: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  };
}

function dtoToFormValues(coupon: CouponDto): CouponFormValues {
  return {
    code: coupon.code,
    amount: coupon.amount != null ? String(coupon.amount) : "",
    percent: coupon.percent != null ? String(coupon.percent) : "",
    startsAt: coupon.startsAt ?? "",
    endsAt: coupon.endsAt ?? "",
    isActive: coupon.isActive,
  };
}

export function CouponPage({ siteCode }: { siteCode: SiteCode }) {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [values, setValues] = useState<CouponFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<CouponFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CouponDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCoupons(siteCode);
      setCoupons(data);
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load coupons",
      );
      showError(error instanceof ApiError ? error.message : "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site coupons.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- coupon list fetch
    void load();
  }, [load]);

  const resetForm = () => {
    setValues(createEmptyFormValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCouponForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toCouponPayload(validation.data);
      if (editingId) {
        await updateCoupon(siteCode, editingId, payload);
        showSuccess("Coupon updated");
      } else {
        await createCoupon(siteCode, payload);
        showSuccess("Coupon created");
      }
      resetForm();
      await load();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon: CouponDto) => {
    setEditingId(coupon.id);
    setValues(dtoToFormValues(coupon));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteCoupon(siteCode, pendingDelete.id);
      showSuccess("Coupon deleted");
      if (editingId === pendingDelete.id) {
        resetForm();
      }
      setPendingDelete(null);
      await load();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponDto) => {
    try {
      await patchCoupon(siteCode, coupon.id, { isActive: !coupon.isActive });
      showSuccess(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to update coupon status",
      );
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Create Coupon Code"
      description="Manage site-scoped discount coupon codes for product assignment and checkout."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Coupon codes
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped coupons for {siteCode === "IN" ? ".in" : ".com"}.
          </p>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load coupons</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-8">
          <CouponForm
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            isEditing={Boolean(editingId)}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
            onReset={resetForm}
          />

          {isLoading ? (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/40" />
          ) : (
            <CouponTable
              coupons={coupons}
              onEdit={handleEdit}
              onDelete={(coupon) => setPendingDelete(coupon)}
              onToggleActive={(coupon) => void handleToggleActive(coupon)}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.code ?? "coupon"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Coupons assigned to products cannot be deleted
              until unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? "Deleting…" : "Delete coupon"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminAppShell>
  );
}
