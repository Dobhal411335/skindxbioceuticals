"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promoPopup } from "@/data/landing";

type PromoPopupBannerProps = {
  /** Delay before opening so the page can paint first. */
  delayMs?: number;
};

export function PromoPopupBanner({ delayMs = 800 }: PromoPopupBannerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!promoPopup.enabled) return;

    try {
      if (window.sessionStorage.getItem(promoPopup.storageKey) === "1") {
        return;
      }
    } catch {
      // Ignore storage failures and still show once per mount.
    }

    const timer = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  function dismiss(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      try {
        window.sessionStorage.setItem(promoPopup.storageKey, "1");
      } catch {
        // no-op
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden border-border p-0 sm:max-w-3xl"
      >
        <div className="grid sm:grid-cols-2">
          <div className="relative min-h-[14rem] bg-primary/15 sm:min-h-[22rem]">
            <Image
              src={promoPopup.image.src}
              alt={promoPopup.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-secondary/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-secondary-foreground sm:p-6">
              <p className="text-xs font-semibold tracking-wide uppercase opacity-90">
                {promoPopup.leftEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">
                {promoPopup.leftTitle}
              </p>
              <p className="mt-2 hidden text-sm text-secondary-foreground/90 sm:block">
                {promoPopup.leftBody}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
            <DialogHeader className="items-center space-y-3 text-center">
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {promoPopup.heading}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {promoPopup.description}
              </DialogDescription>
            </DialogHeader>

            <Button asChild size="lg" variant="outline" className="mt-8 min-w-[12rem]">
              <Link href={promoPopup.cta.href} onClick={() => dismiss(false)}>
                {promoPopup.cta.label}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
