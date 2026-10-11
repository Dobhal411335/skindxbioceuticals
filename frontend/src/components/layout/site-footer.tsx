"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { footer } from "@/data/landing";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";

function formatPhone(number: string): string {
  const digits = String(number || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return number;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM10 15.5V8.5L16 12l-6 3.5Z" />
    </svg>
  );
}

export function SiteFooter() {
  const company = useCompanyBasicInfo();
  const brandName = company.companyName?.trim() || footer.brand;
  const footerLogoSrc =
    company.footerLogo?.url?.trim() || company.mainLogo?.url?.trim() || "";

  const addresses =
    company.officeAddresses?.length > 0
      ? company.officeAddresses
      : footer.contact
          .filter((item) => item.icon === "map")
          .map((item) => item.label);

  const phones =
    company.contactNumbers?.length > 0
      ? company.contactNumbers
      : footer.contact
          .filter((item) => item.icon === "phone")
          .map((item) => item.label);

  const emails =
    company.emails?.length > 0
      ? company.emails
      : footer.contact
          .filter((item) => item.icon === "mail")
          .map((item) => item.label);

  const socialLinks = [
    { href: company.facebookLink, label: "Facebook", Icon: FacebookIcon },
    { href: company.instagramLink, label: "Instagram", Icon: InstagramIcon },
    { href: company.youtubeLink, label: "YouTube", Icon: YoutubeIcon },
  ].filter((item) => Boolean(item.href?.trim()));

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
            Contact us
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {addresses.map((text) => (
              <li key={text} className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
            {phones.map((number) => (
              <li key={number} className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a
                  href={`tel:+91${String(number).replace(/\D/g, "")}`}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {formatPhone(number)}
                </a>
              </li>
            ))}
            {emails.map((email) => (
              <li key={email} className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {email}
                </a>
              </li>
            ))}
          </ul>

          {socialLinks.length > 0 ? (
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          ) : null}
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
          {footerLogoSrc ? (
            <div className="relative mb-3 h-12 w-[180px]">
              <Image
                src={footerLogoSrc}
                alt={brandName}
                fill
                className="object-contain object-left"
                sizes="180px"
              />
            </div>
          ) : (
            <p className="font-display text-3xl font-semibold">{brandName}</p>
          )}
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
          <p className="mt-2">
            © {new Date().getFullYear()} {brandName}
          </p>
        </div>
      </div>
    </footer>
  );
}
