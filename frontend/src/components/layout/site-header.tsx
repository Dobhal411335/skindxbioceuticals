import Link from "next/link";
import { Heart, Search, User } from "lucide-react";

import { HeaderCartButton } from "@/components/layout/header-cart-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { navLinks } from "@/data/landing";

export function SiteHeader() {
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
          className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          SkinDx
        </Link>

        <NavigationMenu className="hidden max-w-none flex-1 justify-center lg:flex" viewport={false}>
          <NavigationMenuList className="flex-wrap gap-1">
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={link.href}
                    className="rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase"
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <form
          className="ml-auto hidden min-w-0 max-w-xs flex-1 items-center gap-0 sm:flex lg:max-w-sm"
          role="search"
          action="/shop"
        >
          <Input
            type="search"
            name="q"
            placeholder="Search products"
            className="rounded-r-none"
            aria-label="Search products"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-l-none"
            aria-label="Submit search"
          >
            <Search className="size-4" />
          </Button>
        </form>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account/login" aria-label="Account">
              <User className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="size-5" />
            </Link>
          </Button>
          <HeaderCartButton />
        </div>
      </div>
    </header>
  );
}
