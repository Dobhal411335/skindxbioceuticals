"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClinicalConfidencePage } from "@/components/clinical-confidence/clinical-confidence-page";
import type { SiteCode } from "@/types/auth";
export default function ClinicalConfidenceRoutePage() { const params = useParams<{ siteCode: string }>(); const router = useRouter(); const value = String(params.siteCode || "").toUpperCase(); const siteCode = value === "IN" || value === "COM" ? value as SiteCode : null; useEffect(() => { if (!siteCode) router.replace("/select-site"); }, [router, siteCode]); return siteCode ? <ClinicalConfidencePage siteCode={siteCode} /> : null; }
