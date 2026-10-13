"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { PopupBannerForm } from "@/components/popup-banner/popup-banner-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/popup-banner/popup-banner-form-utils";
import { PopupBannerSkeleton } from "@/components/popup-banner/popup-banner-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toPopupBannerPayload,
  validatePopupBannerForm,
  type PopupBannerFormErrors,
} from "@/schemas/popup-banner-schema";
import {
  fetchPopupBannerConfig,
  upsertPopupBannerConfig,
} from "@/services/api/popup-banner";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { PopupBannerFormValues } from "@/types/popup-banner";

export function PopupBannerPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<PopupBannerFormValues>(
    createEmptyFormValues,
  );
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errors, setErrors] = useState<PopupBannerFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchPopupBannerConfig(siteCode);
      setValues(dtoToFormValues(dto));
      setRecordId(dto.id);
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load popup banner",
      );
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to load popup banner",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- popup banner fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePopupBannerForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toPopupBannerPayload(validation.data);
      const saved = await upsertPopupBannerConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      setRecordId(saved.id);
      showSuccess("Popup banner saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to save popup banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="PopUp Banner"
      description="Manage the landing popup banner shown to storefront visitors for this website."
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Changes apply to the {siteCode === "IN" ? ".in" : ".com"} site only.
          </p>
          <Button
            type="submit"
            form="popup-banner-form"
            className="gap-2"
            disabled={isLoading || isSubmitting || Boolean(loadError)}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save popup"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load popup banner</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <PopupBannerSkeleton />
        ) : (
          <PopupBannerForm
            siteCode={siteCode}
            recordId={recordId}
            values={values}
            errors={errors}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
          />
        )}
      </div>
    </AdminAppShell>
  );
}
