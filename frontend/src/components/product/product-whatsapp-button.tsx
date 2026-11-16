"use client";

import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { buildProductWhatsAppUrl } from "@/lib/whatsapp";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";

type ProductWhatsAppButtonProps = {
  productName: string;
  productSlug: string;
  className?: string;
  iconClassName?: string;
};

/**
 * Hover action: opens WhatsApp with a product enquiry using company basic info number.
 */
export function ProductWhatsAppButton({
  productName,
  productSlug,
  className,
  iconClassName,
}: ProductWhatsAppButtonProps) {
  const company = useCompanyBasicInfo();

  function openEnquiry(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const href = buildProductWhatsAppUrl({
      whatsappNumber: company.whatsappNumber,
      fallbackPhone: company.contactNumbers?.[0],
      productName,
      productSlug,
    });

    if (!href) {
      showError("WhatsApp number is not configured for this site.", {
        id: "product.whatsapp.missing",
      });
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={cn(
        "group rounded-full border-2 border-[#25D366] bg-[#25D366] text-white shadow-sm",
        "transition-[transform,box-shadow,background-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:scale-105 hover:bg-[#20bd5a] hover:shadow-[0_6px_16px_rgb(37_211_102_/_0.45)]",
        "active:translate-y-0 active:scale-100",
        className,
      )}
      aria-label={`Enquire about ${productName} on WhatsApp`}
      onClick={openEnquiry}
    >
      <WhatsAppIcon
        className={cn(
          "transition-transform duration-200 ease-out group-hover:scale-110",
          iconClassName,
        )}
      />
    </Button>
  );
}
