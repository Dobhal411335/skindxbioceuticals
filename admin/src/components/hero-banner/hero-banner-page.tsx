"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { HeroBannerForm } from "@/components/hero-banner/hero-banner-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/hero-banner/hero-banner-form-utils";
import { HeroBannerSkeleton } from "@/components/hero-banner/hero-banner-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toHeroBannerPayload,
  validateHeroBannerForm,
  type HeroBannerFormErrors,
} from "@/schemas/hero-banner-schema";
import {
  fetchHeroBannerConfig,
  upsertHeroBannerConfig,
} from "@/services/api/hero-banner";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { HeroBannerFormValues } from "@/types/hero-banner";

export function HeroBannerPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<HeroBannerFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<HeroBannerFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchHeroBannerConfig(siteCode);
      setValues(dtoToFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load Hero Banner",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load Hero Banner",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hero banner fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateHeroBannerForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.slides) showError(validation.errors.slides);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toHeroBannerPayload(validation.data);
      const saved = await upsertHeroBannerConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      showSuccess("Hero Banner saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save Hero Banner",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Hero Banner"
      description="Manage home hero carousel slides: image-only full-width, split dual, and associate-brand grid."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Hero Banner Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped slides for {siteCode === "IN" ? ".in" : ".com"}. Full-width
              uses mobile/laptop images only; split uses left/right laptop images;
              associate uses a 4–6 brand grid. Order controls carousel sequence.
            </p>
          </div>
          <Button
            type="submit"
            form="hero-banner-form"
            className="gap-2"
            disabled={isLoading || isSubmitting || Boolean(loadError)}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving…" : "Save hero banners"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load Hero Banner</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <HeroBannerSkeleton />
        ) : (
          <HeroBannerForm
            siteCode={siteCode}
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
