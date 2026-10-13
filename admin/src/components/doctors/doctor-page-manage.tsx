"use client";

import { useCallback, useEffect, useState } from "react";

import { DoctorPageForm } from "@/components/doctors/doctor-page-form";
import {
  createEmptyDoctorPageFormValues,
  dtoToDoctorPageFormValues,
} from "@/components/doctors/doctor-page-form-utils";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toDoctorPagePayload,
  validateDoctorPageForm,
  type DoctorPageFormErrors,
} from "@/schemas/doctor-page-schema";
import {
  fetchDoctorPageConfig,
  upsertDoctorPageConfig,
} from "@/services/api/doctor-page";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { DoctorPageFormValues } from "@/types/doctor-page";

export function DoctorPageManage({ siteCode }: { siteCode: SiteCode }) {
  const [values, setValues] = useState<DoctorPageFormValues>(
    createEmptyDoctorPageFormValues,
  );
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errors, setErrors] = useState<DoctorPageFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchDoctorPageConfig(siteCode);
      setRecordId(dto.id);
      setValues(dtoToDoctorPageFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load doctor page",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load doctor page",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site doctor page config.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- doctor page fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateDoctorPageForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toDoctorPagePayload(validation.data);
      const saved = await upsertDoctorPageConfig(siteCode, payload);
      setRecordId(saved.id);
      setValues(dtoToDoctorPageFormValues(saved));
      showSuccess("Doctor page saved");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save doctor page",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Manage Doctor Page"
      description="Edit the doctors landing page about section and services grid."
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Manage Doctor Page
          </h2>
          <p className="text-sm text-muted-foreground">
            Site-scoped landing content for {siteCode === "IN" ? ".in" : ".com"}.
          </p>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load doctor page</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="h-[28rem] animate-pulse rounded-xl border border-border bg-muted/40" />
        ) : (
          <DoctorPageForm
            siteCode={siteCode}
            recordId={recordId}
            values={values}
            errors={errors}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </AdminAppShell>
  );
}
