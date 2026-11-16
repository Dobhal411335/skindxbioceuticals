"use client";

import type { MouseEvent } from "react";
import { Mail, Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  buildProductWhatsAppUrl,
  digitsOnly,
  resolveProductAbsoluteUrl,
} from "@/lib/whatsapp";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";

type ProductEnquiryContactsProps = {
  productName: string;
  productSlug: string;
  className?: string;
};

function telHref(phone: string): string {
  const digits = digitsOnly(phone);
  return digits ? `tel:+${digits.length === 10 ? `91${digits}` : digits}` : `tel:${phone}`;
}

function mailHref(email: string, productName: string, productSlug: string): string {
  const productUrl = resolveProductAbsoluteUrl(productSlug);
  const subject = encodeURIComponent(`Enquiry: ${productName}`);
  const body = encodeURIComponent(
    [
      "Hello!",
      "",
      `I would like to enquire about this product: ${productName}.`,
      "",
      `Product link: ${productUrl}`,
      "",
      "Please share more details. Thank you.",
    ].join("\n"),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/**
 * PDP / quick-view contact strip: WhatsApp enquiry, call, and email from company basic info.
 */
export function ProductEnquiryContacts({
  productName,
  productSlug,
  className,
}: ProductEnquiryContactsProps) {
  const company = useCompanyBasicInfo();
  const phone = company.contactNumbers?.[0]?.trim() || "";
  const email = company.emails?.[0]?.trim() || "";
  const hasWhatsApp = Boolean(
    digitsOnly(company.whatsappNumber) || digitsOnly(phone),
  );

  if (!hasWhatsApp && !phone && !email) return null;

  function openWhatsApp(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const href = buildProductWhatsAppUrl({
      whatsappNumber: company.whatsappNumber,
      fallbackPhone: phone,
      productName,
      productSlug,
    });
    if (!href) {
      showError("WhatsApp number is not configured for this site.", {
        id: "product.enquiry.whatsapp.missing",
      });
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">Any specific questions</p>
      <div className="flex items-stretch gap-2">
        {hasWhatsApp ? (
          <button
            type="button"
            onClick={openWhatsApp}
            className="group inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-md bg-[#43a378] px-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#359f70] hover:shadow-[0_8px_18px_rgb(37_211_102_/_0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4d36] focus-visible:ring-offset-2 active:translate-y-0"
            aria-label={`WhatsApp product inquiry for ${productName}`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform duration-200 ease-out group-hover:scale-110">
              <WhatsAppIcon className="size-4" />
            </span>
            <span className="truncate">WhatsApp product inquiry</span>
          </button>
        ) : null}

        {phone ? (
          <a
            href={telHref(phone)}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-[#1c2833] text-white transition-colors hover:bg-[#141e26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c2833] focus-visible:ring-offset-2"
            aria-label={`Call ${phone}`}
          >
            <Phone className="size-5" aria-hidden />
          </a>
        ) : null}

        {email ? (
          <a
            href={mailHref(email, productName, productSlug)}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-[#1c2833] text-white transition-colors hover:bg-[#141e26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c2833] focus-visible:ring-offset-2"
            aria-label={`Email ${email}`}
          >
            <Mail className="size-5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
