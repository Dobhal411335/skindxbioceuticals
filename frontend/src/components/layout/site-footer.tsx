"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { footer } from "@/data/landing";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";
import { useFooter } from "@/providers/footer-provider";

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
  const managedFooter = useFooter();
  const brandName = company.companyName?.trim() || footer.brand;
  const footerLogoSrc =
    company.footerLogo?.url?.trim() ||
    company.mainLogo?.url?.trim() ||
    "";

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

  const hours = footer.contact
    .filter((item) => item.icon === "clock")
    .map((item) => item.label);

  const socialLinks = [
    { href: company.facebookLink, label: "Facebook", Icon: FacebookIcon },
    { href: company.instagramLink, label: "Instagram", Icon: InstagramIcon },
    { href: company.youtubeLink, label: "YouTube", Icon: YoutubeIcon },
  ].filter((item) => Boolean(item.href?.trim()));

  const columns = managedFooter.columns;
  const thankYou = managedFooter.thankYou || footer.thankYou;
  const description = managedFooter.description || footer.description;

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Contact Us
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {addresses.map((text) => (
              <li key={text} className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
            {phones.map((number) => (
              <li key={number} className="flex items-start gap-2.5">
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
              <li key={email} className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {email}
                </a>
              </li>
            ))}
            {/* {hours.map((text) => (
              <li key={text} className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{text}</span>
              </li>
            ))} */}
          </ul>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 text-base font-semibold text-foreground">
              {column.title}
            </h2>
            <ul className="space-y-2.5 text-sm">
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

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.1fr_1.4fr_1fr] lg:items-start lg:gap-12">
        <div>
          {footerLogoSrc ? (
            <div className="relative mb-4 h-12 w-[180px]">
              <Image
                src={footerLogoSrc}
                alt={brandName}
                fill
                className="object-contain object-left"
                sizes="180px"
              />
            </div>
          ) : (
            <p className="font-display text-3xl font-semibold text-foreground">
              {brandName}
            </p>
          )}
          <p className="mt-1 text-base font-semibold text-foreground">
            {thankYou}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md text-center lg:max-w-none">
          <h2 className="text-base font-semibold text-foreground">
            Subscribe Our Newsletter
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Product updates and store news. Consent required before any live
            signup.
          </p>
          <form
            className="mt-5"
            action="#"
            method="get"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1.5 shadow-sm">
              <Input
                type="email"
                name="email"
                placeholder="Enter Your Email"
                aria-label="Email address"
                className="h-10 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:border-transparent focus-visible:ring-0"
              />
              <Button
                type="button"
                size="lg"
                className="h-10 shrink-0 rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
              >
                Subscribe
              </Button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-6 lg:items-end lg:text-right">
          {socialLinks.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-foreground">Follow Us</p>
              <div className="mt-3 flex items-center gap-3 lg:justify-end">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-5" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium text-foreground">
              We Accept Payments
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-500">
        <p className="container-page py-5 text-center text-sm text-black">
          © {new Date().getFullYear()} {brandName}
        </p>
      </div>
    </footer>
  );
}
