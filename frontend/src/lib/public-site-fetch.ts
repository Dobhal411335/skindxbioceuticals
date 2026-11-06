const SITE_FETCH_SECRET_HEADER = "x-site-fetch-secret";

/**
 * Headers for public site fetches.
 * Browser calls rely on Origin. Server fetches send SITE_FETCH_SECRET, which is not a NEXT_PUBLIC_ value.
 */
export function publicSiteHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (typeof window === "undefined") {
    const secret = process.env.SITE_FETCH_SECRET?.trim();
    if (secret) headers.set(SITE_FETCH_SECRET_HEADER, secret);
  }

  return headers;
}
