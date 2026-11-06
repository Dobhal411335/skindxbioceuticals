export type SiteCode = "IN" | "COM";

function readSiteCode(): SiteCode {
  const value = process.env.NEXT_PUBLIC_SITE_CODE?.trim().toUpperCase();
  if (value === "IN" || value === "COM") return value;
  throw new Error(
    "NEXT_PUBLIC_SITE_CODE must be IN or COM. Copy .env.local.example to .env.local and set it.",
  );
}

/** Site this frontend deployment reads and writes. Inlined by Next from NEXT_PUBLIC_SITE_CODE. */
export const storefrontSiteCode: SiteCode = readSiteCode();
