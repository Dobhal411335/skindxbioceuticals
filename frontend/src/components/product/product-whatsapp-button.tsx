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
        "rounded-full border-2 bg-[#25D366] text-white shadow-sm transition-all duration-200",
        "hover:border-[#25D366] hover:bg-[#25D366] hover:text-white",
        className,
      )}
      aria-label={`Enquire about ${productName} on WhatsApp`}
      onClick={openEnquiry}
    >
      <WhatsAppIcon className={iconClassName} />
    </Button>
  );
}
