"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { UpdateProductPricesPage } from "@/components/product-prices/update-product-prices-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function UpdateProductPricesRoutePage() {
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

  return <UpdateProductPricesPage siteCode={siteCode} />;
}
