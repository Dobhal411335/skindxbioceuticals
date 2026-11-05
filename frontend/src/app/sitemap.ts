import type { MetadataRoute } from "next";

import {
  getSitemapGroups,
  getStorefrontOrigin,
  toSitemapEntries,
} from "@/features/sitemap/storefront-sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [origin, groups] = await Promise.all([
    getStorefrontOrigin(),
    getSitemapGroups(),
  ]);

  return toSitemapEntries(origin, groups);
}
