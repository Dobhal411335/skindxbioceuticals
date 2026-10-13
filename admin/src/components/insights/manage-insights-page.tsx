"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { InsightsForm } from "@/components/insights/insights-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/insights/insights-form-utils";
import { InsightsSkeleton } from "@/components/insights/insights-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toInsightsConfigPayload,
  validateInsightsForm,
  type InsightsFormErrors,
} from "@/schemas/insights-schema";
import { fetchInsightsConfig, upsertInsightsConfig } from "@/services/api/insights";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { InsightsFormValues } from "@/types/insights";

export function ManageInsightsPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<InsightsFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<InsightsFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchInsightsConfig(siteCode);
      setValues(dtoToFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load Insights settings",
      );
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to load Insights settings",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Insights config fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateInsightsForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.cards) showError(validation.errors.cards);
      else if (validation.errors.qaItems) showError(validation.errors.qaItems);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toInsightsConfigPayload(validation.data);
      const saved = await upsertInsightsConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      showSuccess("Insights settings saved");
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to save Insights settings",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Manage Insights"
      description="Landing Insights banner cards and Q&A for this website."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Insights settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped landing Insights for{" "}
              {siteCode === "IN" ? ".in" : ".com"}. Separate from full Manage Blog
              and Website FAQ.
            </p>
          </div>
          <Button
            type="submit"
            form="insights-form"
            className="h-11 bg-primary px-6 hover:bg-primary-hover"
            disabled={isLoading || isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load Insights settings</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <InsightsSkeleton />
        ) : (
          <InsightsForm
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
