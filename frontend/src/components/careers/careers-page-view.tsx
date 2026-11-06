"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { CareerApplicationForm } from "@/components/careers/career-application-form";
import { careersPage } from "@/data/careers";
import { useCompanyBasicInfo } from "@/providers/company-basic-info-provider";

function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return number;
}

function phoneHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.startsWith("91") && digits.length > 10) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function CareersPageView() {
  const company = useCompanyBasicInfo();
  const emails = company.emails.map((email) => email.trim()).filter(Boolean);
  const phones = company.contactNumbers.map((phone) => phone.trim()).filter(Boolean);
  const locations = company.officeAddresses.map((address) => address.trim()).filter(Boolean);
  const applyLine =
    emails.length > 0
      ? `Submit your application today or email your CV to ${emails.join(" / ")}.`
      : "Submit your application today.";

  return (
    <>
      <section
        className="relative overflow-hidden bg-secondary text-secondary-foreground"
        aria-label="Careers banner"
      >
        <Image
          src="/person/image.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,28,46,0.88),rgba(12,28,46,0.62)_18%,rgba(12,28,46,0.38))]"
          aria-hidden
        />
        <div className="container-page relative flex min-h-[18rem] flex-col justify-end py-12 sm:min-h-[24rem] sm:py-16">
          <nav className="text-sm text-secondary-foreground/75" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-secondary-foreground">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-secondary-foreground">Careers</span>
          </nav>
          <p className="mt-8 text-sm font-semibold tracking-[0.18em] text-[#ef6a24] uppercase">
            Careers
          </p>
          <p className="mt-4 max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {careersPage.bannerLine}
          </p>
          <div className="mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
        </div>
      </section>

      <section className="bg-white" aria-labelledby="careers-heading">
        <div className="container-page section-space py-12 sm:py-16 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]">
            <div>
              <h1
                id="careers-heading"
                className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                {careersPage.title}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[#34475c] sm:text-[1.05rem]">
                {careersPage.intro} {applyLine} {careersPage.privacy}
              </p>

              <div className="mt-8 space-y-4">
                {emails.length > 0 ? (
                  <article className="rounded-[1.5rem] border border-[#e8e5df] bg-[#f7f5f1] p-7">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-primary">
                      <Mail className="size-5" aria-hidden />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-[#17283d]">
                      Send Your CV / Resume
                    </h2>
                    <ul className="mt-4 space-y-2">
                      {emails.map((email) => (
                        <li key={email}>
                          <a
                            href={`mailto:${email}`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {email}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ) : null}

                {phones.length > 0 ? (
                  <article className="rounded-[1.5rem] border border-[#e8e5df] bg-[#f7f5f1] p-7">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-primary">
                      <Phone className="size-5" aria-hidden />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-[#17283d]">Inquiries</h2>
                    <ul className="mt-4 space-y-2">
                      {phones.map((phone) => (
                        <li key={phone}>
                          <a
                            href={phoneHref(phone)}
                            className="text-sm font-medium text-[#17283d] hover:text-primary"
                          >
                            {formatPhone(phone)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ) : null}

                {locations.length > 0 ? (
                  <article className="rounded-[1.5rem] border border-[#e8e5df] bg-[#f7f5f1] p-7">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-primary">
                      <MapPin className="size-5" aria-hidden />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-[#17283d]">Work Locations</h2>
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                      {locations.map((address) => (
                        <li key={address} className="text-sm leading-relaxed text-[#657487]">
                          {address}
                        </li>
                      ))}
                    </ul>
                  </article>
                ) : null}
              </div>
            </div>

            <CareerApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
