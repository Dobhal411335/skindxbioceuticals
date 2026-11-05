"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { CareerResumePage } from "@/components/careers/career-resume-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function CareerResumeRoutePage() {
  const params = useParams<{ siteCode: string; applicationId: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);
  const applicationId = Array.isArray(params.applicationId)
    ? params.applicationId[0]
    : params.applicationId;

  useEffect(() => {
    if (!siteCode || !applicationId) router.replace("/select-site");
  }, [siteCode, applicationId, router]);

  if (!siteCode || !applicationId) return null;
  return <CareerResumePage siteCode={siteCode} applicationId={applicationId} />;
}
