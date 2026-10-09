import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { footer } from "@/data/landing";

const contactIcons = {
  map: MapPin,
  phone: Phone,
  mail: Mail,
  clock: Clock,
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
            Contact us
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {footer.contact.map((item) => {
              const Icon = contactIcons[item.icon];
              return (
                <li key={item.label} className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {footer.columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
              {column.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Separator />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold">{footer.brand}</p>
          <p className="mt-2 text-sm font-medium">{footer.thankYou}</p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {footer.description}
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Subscribe to our newsletter</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Product updates and store news. Consent required before any live signup.
          </p>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" action="#" method="get">
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              aria-label="Email address"
              className="bg-background"
            />
            <Button type="button" variant="secondary">
              Subscribe
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            UI only — no email is collected on this static page.
          </p>
        </div>

        <div className="text-sm text-muted-foreground lg:text-right">
          <p>Payments prepared for Razorpay</p>
          <p className="mt-2">© {new Date().getFullYear()} SkinDx Bioceuticals</p>
        </div>
      </div>
    </footer>
  );
}
