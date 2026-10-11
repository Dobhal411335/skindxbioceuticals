"use client";

import { notFound, useParams } from "next/navigation";

import { ModulePageShell } from "@/components/modules/module-page-shell";
import { findModuleBySlug } from "@/config/admin-modules";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function AdminModulePage() {
  const params = useParams<{ siteCode: string; moduleSlug: string | string[] }>();
  const siteCode = normalizeSiteCode(params.siteCode);
  const slugParts = Array.isArray(params.moduleSlug)
    ? params.moduleSlug
    : params.moduleSlug
      ? [params.moduleSlug]
      : [];

  if (!siteCode) {
    notFound();
  }

  const moduleDef = findModuleBySlug(siteCode, slugParts);
  if (!moduleDef) {
    notFound();
  }

  return <ModulePageShell siteCode={siteCode} module={moduleDef} />;
}
