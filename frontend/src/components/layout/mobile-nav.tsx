"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";
import { useNavbarSections } from "@/providers/navbar-sections-provider";

export function MobileNav() {
  const company = useCompanyBasicInfo();
  const navLinks = useNavbarSections();
  const brandName = company.companyName?.trim() || "SkinDx Bioc";
  const logoUrl =
    company.mobileUiLogo?.url?.trim() || company.mainLogo?.url?.trim() || "";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,20rem)]">
        <SheetHeader>
          <SheetTitle className="font-display text-left text-xl">
            {logoUrl ? (
              <span className="relative block h-9 w-[140px]">
                <Image
                  src={logoUrl}
                  alt={brandName}
                  fill
                  className="object-contain object-left"
                  sizes="140px"
                />
              </span>
            ) : (
              brandName
            )}
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Mobile">
          {navLinks.map((link) => (
            <div key={link.id} className="flex flex-col">
              <Link
                href={link.href}
                className="rounded-md px-2 py-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
              {link.children.length > 0 ? (
                <div className="mb-1 ml-3 flex flex-col border-l border-border pl-3">
                  {link.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
