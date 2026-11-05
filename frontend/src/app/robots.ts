import type { MetadataRoute } from "next";

import { getStorefrontOrigin } from "@/features/sitemap/storefront-sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getStorefrontOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/cart",
        "/checkout",
        "/wishlist",
        "/vendor",
        "/unsubscribe",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
