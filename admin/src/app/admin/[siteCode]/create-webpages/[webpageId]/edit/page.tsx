"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { EditWebpagePage } from "@/components/webpages/edit-webpage-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(
  value: string | string[] | undefined,
): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function EditWebpageRoutePage() {
  const params = useParams<{ siteCode: string; webpageId: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);
  const webpageId = Array.isArray(params.webpageId)
    ? params.webpageId[0]
    : params.webpageId;

  useEffect(() => {
    if (!siteCode) {
      router.replace("/select-site");
    }
  }, [siteCode, router]);

  if (!siteCode || !webpageId) {
    return null;
  }

  return <EditWebpagePage siteCode={siteCode} webpageId={webpageId} />;
}
