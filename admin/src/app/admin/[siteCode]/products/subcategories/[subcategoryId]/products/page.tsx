"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AddProductPage } from "@/components/catalog/add-product-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function SubcategoryProductsRoutePage() {
  const params = useParams<{ siteCode: string; subcategoryId: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);
  const subcategoryId = Array.isArray(params.subcategoryId)
    ? params.subcategoryId[0]
    : params.subcategoryId;

  useEffect(() => {
    if (!siteCode) {
      router.replace("/select-site");
    }
  }, [siteCode, router]);

  if (!siteCode || !subcategoryId) {
    return null;
  }

  return <AddProductPage siteCode={siteCode} subcategoryId={subcategoryId} />;
}
