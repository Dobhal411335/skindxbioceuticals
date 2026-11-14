/** Localhost hostnames as returned by URL.hostname (IPv6 keeps brackets) or raw. */
export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function isIpHostname(hostname: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  // IPv6: URL.hostname is bracketed; also accept a raw address with ':'.
  if (hostname.startsWith('[') && hostname.endsWith(']')) return true;
  return hostname.includes(':');
}

/** Apex ↔ www twin for public hostnames (not localhost / IPs). */
export function wwwTwinOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (isLocalHostname(host) || isIpHostname(host)) {
      return null;
    }
    url.hostname = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
    return url.origin;
  } catch {
    return null;
  }
}

/** True when request origin matches the site URL or its www/apex twin. */
export function isSameSitePublicOrigin(
  requestOrigin: string,
  allowedSiteOrigin: string,
): boolean {
  if (requestOrigin === allowedSiteOrigin) return true;
  const twin = wwwTwinOrigin(allowedSiteOrigin);
  return twin != null && requestOrigin === twin;
}

/** Ensure browser CORS allows both apex and www for each configured origin. */
export function expandCorsOriginsWithWwwTwins(origins: string[]): string[] {
  const expanded = new Set<string>();
  for (const origin of origins) {
    const trimmed = origin.trim();
    if (!trimmed) continue;
    expanded.add(trimmed);
    const twin = wwwTwinOrigin(trimmed);
    if (twin) expanded.add(twin);
  }
  return [...expanded];
}
