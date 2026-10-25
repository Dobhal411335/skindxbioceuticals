"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useEffect, useState } from "react";

import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import { HeaderCartButton } from "@/components/layout/header-cart-button";
import { HeaderSearchButton } from "@/components/layout/header-search-button";
import { HeaderWishlistButton } from "@/components/layout/header-wishlist-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";
import { useNavbarSections } from "@/providers/navbar-sections-provider";
import { useTopAdvertisement } from "@/providers/top-advertisement-provider";
const navTriggerClassName =
  "relative rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase text-foreground/80 transition-[color,background-color,transform] duration-200 ease-out hover:bg-transparent hover:text-foreground focus:bg-transparent active:scale-[0.98] after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 data-open:bg-muted/50 data-open:text-foreground data-open:after:scale-x-100 data-popup-open:bg-muted/50 data-popup-open:text-foreground data-popup-open:after:scale-x-100";

const navLinkClassName =
  "relative rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase text-foreground/80 transition-[color,background-color,transform] duration-200 ease-out hover:bg-transparent hover:text-foreground focus:bg-transparent active:scale-[0.98] after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100";

function UtilityLine({
  text,
  href,
  className,
}: {
  text: string;
  href?: string;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`transition-colors hover:text-foreground ${className ?? ""}`}>
        {text}
      </Link>
    );
  }
  return <p className={className}>{text}</p>;
}

export function SiteHeader() {
  const company = useCompanyBasicInfo();
  const navLinks = useNavbarSections();
  const { utilityItems } = useTopAdvertisement();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const brandName = company.companyName?.trim() || "SkinDx";
  const logoUrl = company.mainLogo?.url?.trim() || company.mobileUiLogo?.url?.trim() || "";
  const leftUtility = utilityItems[0];
  const rightUtility = utilityItems[1];

  return (
    <>
      {(leftUtility || rightUtility) && (
        <div className="hidden border-b border-border bg-surface md:block">
          <div className="container-page flex items-center justify-between py-2 text-xs text-muted-foreground">
            {leftUtility ? (
              <UtilityLine text={leftUtility.text} href={leftUtility.href} />
            ) : (
              <span />
            )}
            {rightUtility ? (
              <UtilityLine
                text={rightUtility.text}
                href={rightUtility.href}
                className="tracking-wide"
              />
            ) : null}
          </div>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-shadow duration-200 supports-backdrop-filter:bg-background/80",
          isScrolled && "shadow-sm",
        )}
      >
        <div className="container-page flex items-center gap-3 py-3 lg:gap-6 lg:py-4">
          <MobileNav />

          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-foreground transition-opacity duration-200 hover:opacity-90 sm:text-3xl"
            aria-label={brandName}
          >
            {logoUrl ? (
              <span className="relative block h-10 w-[140px] sm:h-11 sm:w-[160px]">
                <Image
                  src={logoUrl}
                  alt={brandName}
                  fill
                  className="object-contain object-left"
                  sizes="160px"
                  priority
                />
              </span>
            ) : (
              brandName
            )}
          </Link>

          <NavigationMenu
            className="hidden max-w-none flex-1 justify-center lg:flex"
            viewport={false}
          >
            <NavigationMenuList className="flex-wrap gap-1 rounded-full border border-border/70 bg-muted/35 px-2 py-1 shadow-sm">
              {navLinks.map((link) => {
                const hasChildren = link.children.length > 0;

                if (!hasChildren) {
                  return (
                    <NavigationMenuItem key={link.id}>
                      <NavigationMenuLink asChild>
                        <Link href={link.href} className={navLinkClassName}>
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }

                return (
                  <NavigationMenuItem key={link.id}>
                    <NavigationMenuTrigger className={navTriggerClassName}>
                      {link.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="relative z-50 overflow-visible! rounded-none! bg-transparent! origin-top p-0 shadow-none! ring-0! before:pointer-events-none before:absolute before:-top-2 before:left-12 before:z-0 before:size-4 before:rotate-45 before:border-l before:border-t before:border-[#e5ded4] before:bg-white data-open:slide-in-from-top-2 data-closed:slide-out-to-top-1">
                      <div className="relative z-10 w-[min(430px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#e5ded4] bg-white p-3 shadow-[0_18px_45px_rgba(31,43,55,0.18)]">
                        <div className="rounded-3xl bg-[#203640] px-5 py-5 text-white">
                          <h3 className="text-xl text-[#f28b5b] font-semibold tracking-tight">
                            {link.menuHeading || link.label}
                          </h3>
                          {link.menuDescription ? (
                            <p className="mt-1 text-sm text-white/70">{link.menuDescription}</p>
                          ) : null}
                        </div>
                        <ul className="mt-2 grid gap-1">
                          {link.children.map((child, index) => (
                            <li key={child.id}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-[#f8f4ee] focus:bg-[#f8f4ee]"
                                >
                                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#edd9c9] bg-[#fbf1e9] text-xs font-semibold text-[#b85f35]">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-[#20303a]">
                                      {child.label}
                                    </span>
                                    {child.description ? (
                                      <span className="mt-0.5 block truncate text-xs text-[#71808a]">
                                        {child.description}
                                      </span>
                                    ) : null}
                                  </span>
                                  <ArrowUpRight className="size-4 shrink-0 text-[#d9784c] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/doctors"
                    className="rounded-full border border-primary/20 hover:text-white bg-white text-black px-4 py-2 text-xs font-semibold tracking-wide shadow-sm transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Appointment your doctor
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center gap-2">
            <HeaderSearchButton />
            <HeaderAccountMenu />
            <HeaderWishlistButton />
            <HeaderCartButton />
          </div>
        </div>
      </header>
    </>
  );
}
