"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { AboutUsBannerForm } from "@/components/about-us-banner/about-us-banner-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/about-us-banner/about-us-banner-form-utils";
import { AboutUsBannerSkeleton } from "@/components/about-us-banner/about-us-banner-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toAboutUsBannerPayload,
  validateAboutUsBannerForm,
  type AboutUsBannerFormErrors,
} from "@/schemas/about-us-banner-schema";
import {
  fetchAboutUsBannerConfig,
  upsertAboutUsBannerConfig,
} from "@/services/api/about-us-banner";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { AboutUsBannerFormValues } from "@/types/about-us-banner";

export function AboutUsBannerPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<AboutUsBannerFormValues>(
    createEmptyFormValues,
  );
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errors, setErrors] = useState<AboutUsBannerFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchAboutUsBannerConfig(siteCode);
      setValues(dtoToFormValues(dto));
      setRecordId(dto.id);
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load About Us banner",
      );
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to load About Us banner",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- about us banner fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateAboutUsBannerForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toAboutUsBannerPayload(validation.data);
      const saved = await upsertAboutUsBannerConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      setRecordId(saved.id);
      showSuccess("About Us banner saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to save About Us banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="About Us Banner"
      description="Manage the home promo header, about cards carousel, and dual bottom block for this website."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Changes apply to the {siteCode === "IN" ? ".in" : ".com"} site only.
          </p>
          <Button
            type="submit"
            form="about-us-banner-form"
            className="gap-2"
            disabled={isLoading || isSubmitting || Boolean(loadError)}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save banner"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load About Us banner</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <AboutUsBannerSkeleton />
        ) : (
          <AboutUsBannerForm
            siteCode={siteCode}
            recordId={recordId}
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
