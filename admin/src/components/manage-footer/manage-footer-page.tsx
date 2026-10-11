"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { ManageFooterForm } from "@/components/manage-footer/manage-footer-form";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/manage-footer/manage-footer-form-utils";
import { ManageFooterSkeleton } from "@/components/manage-footer/manage-footer-skeleton";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toFooterConfigPayload,
  validateManageFooterForm,
  type ManageFooterFormErrors,
} from "@/schemas/manage-footer-schema";
import {
  fetchFooterConfig,
  upsertFooterConfig,
} from "@/services/api/manage-footer";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { ManageFooterFormValues } from "@/types/manage-footer";

export function ManageFooterPage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<ManageFooterFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<ManageFooterFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchFooterConfig(siteCode);
      setValues(dtoToFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load footer config",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load footer config",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- footer config fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateManageFooterForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toFooterConfigPayload(validation.data);
      const saved = await upsertFooterConfig(siteCode, payload);
      setValues(dtoToFormValues(saved));
      showSuccess("Footer settings saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save footer settings",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Manage Footer"
      description="Configure footer columns and brand copy for this website. Logo and social links are managed in Company Basic Info."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Footer Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped footer for {siteCode === "IN" ? ".in" : ".com"}.
            </p>
          </div>
          <Button
            type="submit"
            form="manage-footer-form"
            className="h-11 px-6 bg-primary hover:bg-primary-hover"
            disabled={isLoading || isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load footer settings</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <ManageFooterSkeleton />
        ) : (
          <ManageFooterForm
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
