"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { EditBlogPage } from "@/components/blog/edit-blog-page";
import type { SiteCode } from "@/types/auth";

function normalizeSiteCode(value: string | string[] | undefined): SiteCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (code === "IN" || code === "COM") return code;
  return null;
}

export default function EditBlogRoutePage() {
  const params = useParams<{ siteCode: string; blogId: string }>();
  const router = useRouter();
  const siteCode = normalizeSiteCode(params.siteCode);
  const blogId = Array.isArray(params.blogId) ? params.blogId[0] : params.blogId;

  useEffect(() => {
    if (!siteCode) {
      router.replace("/select-site");
    }
  }, [siteCode, router]);

  if (!siteCode || !blogId) {
    return null;
  }

  return <EditBlogPage siteCode={siteCode} blogId={blogId} />;
}
