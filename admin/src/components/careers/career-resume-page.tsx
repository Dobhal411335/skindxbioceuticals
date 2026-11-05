"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchCareerResumeAccess } from "@/services/api/career-application";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { CareerResumeAccess } from "@/types/career-application";

function previewSrc(access: CareerResumeAccess): string {
  if (access.mimeType === "application/pdf") return access.url;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(access.url)}`;
}

export function CareerResumePage({
  siteCode,
  applicationId,
}: {
  siteCode: SiteCode;
  applicationId: string;
}) {
  const [access, setAccess] = useState<CareerResumeAccess | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchCareerResumeAccess(siteCode, applicationId)
      .then((result) => {
        if (!cancelled) setAccess(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Résumé could not be opened");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [siteCode, applicationId]);

  return (
    <AdminAppShell title="Résumé" siteCode={siteCode}>
      <div className="space-y-4">
        <Button type="button" variant="outline" asChild>
          <Link href={`/admin/${siteCode.toLowerCase()}/career-applications`}>
            Back to applications
          </Link>
        </Button>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Résumé unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {access ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">{access.fileName}</p>
              <a
                href={access.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open file
              </a>
            </div>
            <iframe
              title={access.fileName}
              src={previewSrc(access)}
              className="h-[80vh] w-full rounded-lg border border-border bg-white"
            />
            <p className="text-xs text-muted-foreground">
              This preview link expires after 15 minutes. Refresh the page to open it again.
            </p>
          </div>
        ) : !error ? (
          <p className="text-sm text-muted-foreground">Loading résumé...</p>
        ) : null}
      </div>
    </AdminAppShell>
  );
}
