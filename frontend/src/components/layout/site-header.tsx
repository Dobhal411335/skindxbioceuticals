"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import { HeaderCartButton } from "@/components/layout/header-cart-button";
import { HeaderSearchButton } from "@/components/layout/header-search-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";
import { useNavbarSections } from "@/providers/navbar-sections-provider";

const navTriggerClassName =
  "relative rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase text-foreground/80 transition-[color,background-color,transform] duration-200 ease-out hover:bg-transparent hover:text-foreground focus:bg-transparent active:scale-[0.98] after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 data-open:bg-muted/50 data-open:text-foreground data-open:after:scale-x-100 data-popup-open:bg-muted/50 data-popup-open:text-foreground data-popup-open:after:scale-x-100";

const navLinkClassName =
  "relative rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase text-foreground/80 transition-[color,background-color,transform] duration-200 ease-out hover:bg-transparent hover:text-foreground focus:bg-transparent active:scale-[0.98] after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100";

const navDropdownLinkClassName =
  "block rounded-md px-3 py-2 text-sm transition-[color,background-color,transform] duration-200 ease-out hover:translate-x-0.5 focus-visible:translate-x-0.5";

const navDropdownParentLinkClassName = `${navDropdownLinkClassName} font-medium`;

export function SiteHeader() {
  const company = useCompanyBasicInfo();
  const navLinks = useNavbarSections();
  const brandName = company.companyName?.trim() || "SkinDx";
  const logoUrl =
    company.mainLogo?.url?.trim() || company.mobileUiLogo?.url?.trim() || "";

  return (
    <header className="border-b border-border bg-background">
      <div className="hidden border-b border-border bg-surface md:block">
        <div className="container-page flex items-center justify-between py-2 text-xs text-muted-foreground">
          <p>India storefront · Prices in INR</p>
          <p className="tracking-wide">Complimentary shipping over ₹999</p>
        </div>
      </div>

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
          <NavigationMenuList className="flex-wrap gap-1">
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
                  <NavigationMenuContent className="origin-top data-open:slide-in-from-top-2 data-closed:slide-out-to-top-1">
                    <ul className="grid min-w-[220px] gap-1 p-1">
                      {link.href && link.href !== "#" ? (
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href={link.href}
                              className={navDropdownParentLinkClassName}
                            >
                              {link.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ) : null}
                      {link.children.map((child) => (
                        <li key={child.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={child.href}
                              className={navDropdownLinkClassName}
                            >
                              {child.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-0.5">
          <HeaderSearchButton />
          <HeaderAccountMenu />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/account/wishlist" aria-label="Wishlist">
              <Heart className="size-5" />
            </Link>
          </Button>
          <HeaderCartButton />
        </div>
      </div>
    </header>
  );
}
