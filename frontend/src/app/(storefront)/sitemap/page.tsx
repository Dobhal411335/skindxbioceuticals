import type { Metadata } from "next";

import { SitemapPageView } from "@/components/sitemap/sitemap-page-view";
import { getSitemapGroups } from "@/features/sitemap/storefront-sitemap";

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Browse the public pages on SkinDx Bioceuticals, including products, categories, articles, and company information.",
};

export default async function SitemapPage() {
  const groups = await getSitemapGroups();
  return <SitemapPageView groups={groups} />;
}
