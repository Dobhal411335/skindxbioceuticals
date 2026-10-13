"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ManageBlogPage } from "@/components/blog/manage-blog-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function ManageBlogRoutePage() {
  const params = useParams<{ siteCode: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);

  useEffect(() => {
    if (!siteCode) {
      router.replace("/select-site");
    }
  }, [siteCode, router]);

  if (!siteCode) {
    return null;
  }

  return <ManageBlogPage siteCode={siteCode} />;
}
