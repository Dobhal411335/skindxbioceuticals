"use client";

import { ClassicArticleSections } from "@/components/webpages/designs/classic-article-sections";
import type { SiteCode } from "@/types/auth";
import type { WebpageEditFormValues } from "@/types/webpages";

export function Design1Form({
  siteCode,
  webpageId,
  values,
  setValues,
}: {
  siteCode: SiteCode;
  webpageId: string;
  values: WebpageEditFormValues;
  setValues: React.Dispatch<React.SetStateAction<WebpageEditFormValues>>;
}) {
  return (
    <ClassicArticleSections
      siteCode={siteCode}
      webpageId={webpageId}
      values={values}
      setValues={setValues}
      variant="design1"
    />
  );
}
