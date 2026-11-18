import { storefrontSiteCode } from "@/config/site";

const SITE_FETCH_SECRET_HEADER = "x-site-fetch-secret";
const STOREFRONT_SITE_HEADER = "x-storefront-site";

/**
 * Headers for public site fetches.
 * Browser calls rely on Origin. Server fetches send SITE_FETCH_SECRET, which is not a NEXT_PUBLIC_ value.
 */
export function publicSiteHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  headers.set(STOREFRONT_SITE_HEADER, storefrontSiteCode);

  if (typeof window === "undefined") {
    const secret = process.env.SITE_FETCH_SECRET?.trim();
    if (secret) headers.set(SITE_FETCH_SECRET_HEADER, secret);
  }

  return headers;
}
