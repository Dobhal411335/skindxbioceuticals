"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { TopAdvertisementForm } from "@/components/top-advertisement/top-advertisement-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/top-advertisement/top-advertisement-form-utils";
import { TopAdvertisementSkeleton } from "@/components/top-advertisement/top-advertisement-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toTopAdvertisementPayload,
  validateTopAdvertisementForm,
  type TopAdvertisementFormErrors,
} from "@/schemas/top-advertisement-schema";
import {
  fetchTopAdvertisementConfig,
  upsertTopAdvertisementConfig,
} from "@/services/api/top-advertisement";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { TopAdvertisementFormValues } from "@/types/top-advertisement";

export function TopAdvertisementPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<TopAdvertisementFormValues>(
    createEmptyFormValues,
  );
  const [errors, setErrors] = useState<TopAdvertisementFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchTopAdvertisementConfig(siteCode);
      setValues(dtoToFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load top advertisement",
      );
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to load top advertisement",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- top advertisement fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateTopAdvertisementForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toTopAdvertisementPayload(validation.data);
      const saved = await upsertTopAdvertisementConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      showSuccess("Top advertisement saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to save top advertisement",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Top Advertisement Banner"
      description="Manage the announcement bar, header utility strip, and feature benefits for this website."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Top Advertisement
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped for {siteCode === "IN" ? ".in" : ".com"}.
            </p>
          </div>
          <Button
            type="submit"
            form="top-advertisement-form"
            className="h-11 gap-2"
            disabled={isLoading || isSubmitting || Boolean(loadError)}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <TopAdvertisementSkeleton />
        ) : (
          <TopAdvertisementForm
            values={values}
            errors={errors}
            onChange={setValues}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </AdminAppShell>
  );
}
