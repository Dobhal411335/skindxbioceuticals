"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createEmptyFormValues,
  dtoToFormValues,
} from "@/components/manage-navbar/manage-navbar-form-utils";
import { ManageNavbarForm } from "@/components/manage-navbar/manage-navbar-form";
import { ManageNavbarTable } from "@/components/manage-navbar/manage-navbar-table";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toNavbarSectionPayload,
  validateNavbarSectionForm,
  type NavbarSectionFormErrors,
} from "@/schemas/manage-navbar-schema";
import {
  createNavbarSection,
  deleteNavbarSection,
  fetchNavbarSections,
  patchNavbarSectionActive,
  updateNavbarSection,
} from "@/services/api/manage-navbar";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  NavbarSectionDto,
  NavbarSectionFormValues,
} from "@/types/manage-navbar";

export function ManageNavbarPage({ siteCode }: { siteCode: SiteCode }) {
  const [sections, setSections] = useState<NavbarSectionDto[]>([]);
  const [values, setValues] = useState<NavbarSectionFormValues>(createEmptyFormValues);
  const [errors, setErrors] = useState<NavbarSectionFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchNavbarSections(siteCode);
      setSections(data);
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load navbar sections",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load navbar sections",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    // Intentional data-fetch for the selected site.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navbar sections fetch
    void load();
  }, [load]);

  const resetForm = () => {
    setValues(createEmptyFormValues());
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateNavbarSectionForm(values);
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toNavbarSectionPayload(
        validation.data,
        sections.length + 1,
      );
      if (editingId) {
        await updateNavbarSection(siteCode, editingId, payload);
        showSuccess("Navbar section updated");
      } else {
        await createNavbarSection(siteCode, payload);
        showSuccess("Navbar section created");
      }
      resetForm();
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save navbar section",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (section: NavbarSectionDto) => {
    setEditingId(section.id);
    setValues(dtoToFormValues(section));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (section: NavbarSectionDto) => {
    try {
      await deleteNavbarSection(siteCode, section.id);
      showSuccess("Navbar section deleted");
      if (editingId === section.id) {
        resetForm();
      }
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete navbar section",
      );
    }
  };

  const handleToggleActive = async (section: NavbarSectionDto) => {
    try {
      await patchNavbarSectionActive(siteCode, section.id, !section.active);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update navbar section status",
      );
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Navigation Menu"
      description="Create top-level links and nested sub-sections for the header."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Manage Navbar
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped navigation for {siteCode === "IN" ? ".in" : ".com"}.
            </p>
          </div>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel Editing
            </Button>
          ) : null}
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load navbar sections</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <ManageNavbarForm
              values={values}
              errors={errors}
              isSubmitting={isSubmitting}
              isEditing={Boolean(editingId)}
              onChange={setValues}
              onSubmit={(event) => void handleSubmit(event)}
              onReset={resetForm}
            />
          </div>
          <div className="xl:col-span-7">
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <ManageNavbarTable
                sections={sections}
                onEdit={handleEdit}
                onDelete={(section) => void handleDelete(section)}
                onToggleActive={(section) => void handleToggleActive(section)}
              />
            )}
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}

function CardSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/40" />
  );
}
