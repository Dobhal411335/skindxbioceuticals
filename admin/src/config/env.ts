const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Public storefront bases for copyable product URLs.
 * Prefer site-specific vars; fall back to a shared STOREFRONT_URL, then localhost
 * defaults that match backend SITE_IN_URL / SITE_COM_URL.
 */
const storefrontInUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_STOREFRONT_IN_URL?.trim() ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
    "http://localhost:3000",
);

const storefrontComUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_STOREFRONT_COM_URL?.trim() ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
    "http://localhost:3001",
);

export const env = {
  apiUrl,
  storefrontInUrl,
  storefrontComUrl,
} as const;

export function storefrontBaseUrl(siteCode: "IN" | "COM"): string {
  return siteCode === "COM" ? env.storefrontComUrl : env.storefrontInUrl;
}
