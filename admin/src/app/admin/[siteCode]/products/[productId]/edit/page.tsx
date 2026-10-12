"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { EditProductPage } from "@/components/catalog/edit-product-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function EditProductRoutePage() {
  const params = useParams<{ siteCode: string; productId: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  useEffect(() => {
    if (!siteCode) {
      router.replace("/select-site");
    }
  }, [siteCode, router]);

  if (!siteCode || !productId) {
    return null;
  }

  return <EditProductPage siteCode={siteCode} productId={productId} />;
}
