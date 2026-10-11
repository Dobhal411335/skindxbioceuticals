"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { CompanyBasicInfoForm } from "@/components/company-basic-info/company-basic-info-form";
import { CompanyBasicInfoSkeleton } from "@/components/company-basic-info/company-basic-info-skeleton";
import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/company-basic-info/company-form-utils";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toCompanyBasicInfoPayload,
  validateCompanyBasicInfoForm,
  type CompanyBasicInfoFormErrors,
} from "@/schemas/company-basic-info-schema";
import {
  fetchCompanyBasicInfo,
  upsertCompanyBasicInfo,
} from "@/services/api/company-basic-info";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { CompanyBasicInfoFormValues } from "@/types/company-basic-info";

export function CompanyBasicInfoPage({ siteCode }: { siteCode: SiteCode }) {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [values, setValues] = useState<CompanyBasicInfoFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<CompanyBasicInfoFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const dto = await fetchCompanyBasicInfo(siteCode);
      setRecordId(dto.id);
      setValues(dtoToFormValues(dto));
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load company basic info",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load company basic info",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- company info fetch
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateCompanyBasicInfoForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toCompanyBasicInfoPayload(validation.data);
      const saved = await upsertCompanyBasicInfo(siteCode, payload);
      setRecordId(saved.id);
      setValues(dtoToFormValues(saved));
      showSuccess("Company basic info saved");
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to save company info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Company Details"
      description="Manage business information and brand assets for this website."
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Company Basic Info
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped profile for {siteCode === "IN" ? ".in" : ".com"}.
            </p>
          </div>
          <Button
            type="submit"
            form="company-basic-info-form"
            className="h-11 px-6 bg-primary hover:bg-primary-hover"
            disabled={isLoading || isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load company info</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <CompanyBasicInfoSkeleton />
        ) : (
          <CompanyBasicInfoForm
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
