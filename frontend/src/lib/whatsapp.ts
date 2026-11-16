/**
 * WhatsApp helpers for product enquiry links.
 * Numbers come from company basic info (10-digit Indian mobile in admin).
 */

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Normalize for `wa.me`. Admin stores 10-digit Indian mobiles; prepend 91 when needed.
 */
export function toWhatsAppChatDigits(
  whatsappNumber: string | null | undefined,
  fallbackPhone?: string | null,
): string {
  const raw = digitsOnly(whatsappNumber) || digitsOnly(fallbackPhone);
  if (!raw) return "";
  if (raw.length === 10) return `91${raw}`;
  if (raw.length === 11 && raw.startsWith("0")) return `91${raw.slice(1)}`;
  if (raw.length === 12 && raw.startsWith("91")) return raw;
  return raw;
}

export function buildProductEnquiryMessage(input: {
  productName: string;
  productUrl: string;
}): string {
  const name = input.productName.trim() || "this product";
  return [
    "Hello!",
    "",
    `I would like to enquire about this product: ${name}.`,
    "",
    `Product link: ${input.productUrl}`,
    "",
    "Please share more details. Thank you.",
  ].join("\n");
}

export function resolveProductAbsoluteUrl(productSlug: string): string {
  const path = `/products/${encodeURIComponent(productSlug.trim())}`;
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

export function buildProductWhatsAppUrl(input: {
  whatsappNumber: string | null | undefined;
  fallbackPhone?: string | null;
  productName: string;
  productSlug: string;
}): string | null {
  const chatDigits = toWhatsAppChatDigits(
    input.whatsappNumber,
    input.fallbackPhone,
  );
  if (!chatDigits) return null;

  const productUrl = resolveProductAbsoluteUrl(input.productSlug);
  const text = buildProductEnquiryMessage({
    productName: input.productName,
    productUrl,
  });
  return `https://wa.me/${chatDigits}?text=${encodeURIComponent(text)}`;
}
