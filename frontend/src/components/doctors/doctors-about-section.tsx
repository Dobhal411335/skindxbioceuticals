import Link from "next/link";
import { Play } from "lucide-react";

import type { DoctorPageConfig } from "@/types/doctors";

type DoctorsAboutSectionProps = {
  config: DoctorPageConfig;
};

export function DoctorsAboutSection({ config }: DoctorsAboutSectionProps) {
  const hasContent =
    config.aboutHeading ||
    config.aboutDescription ||
    config.aboutHighlights.length > 0 ||
    config.aboutImageUrl;

  if (!hasContent) {
    return null;
  }

  const highlights = config.aboutHighlights.filter(Boolean);
  const buttonHref = config.aboutButtonUrl?.trim() || "#";

  return (
    <section className="container-page py-14 md:py-20" aria-labelledby="doctors-about-heading">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-primary" aria-hidden />
            About Us
          </p>
          {config.aboutHeading ? (
            <h1
              id="doctors-about-heading"
              className="max-w-xl text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-tight"
            >
              {config.aboutHeading}
            </h1>
          ) : null}
          {config.aboutDescription ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {config.aboutDescription}
            </p>
          ) : null}

          {highlights.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-foreground" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {config.aboutButtonLabel ? (
            <div className="mt-8">
              <Link
                href={buttonHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {config.aboutButtonLabel}
                <span aria-hidden>+</span>
              </Link>
            </div>
          ) : null}
        </div>

        {(config.aboutImageUrl || config.aboutSecondaryImageUrl) && (
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative">
              {config.aboutImageUrl ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- CMS Cloudinary URL */}
                  <img
                    src={config.aboutImageUrl}
                    alt=""
                    className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
                  />
                  {config.experienceYears != null && config.experienceYears > 0 ? (
                    <div className="absolute left-4 top-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg">
                      <p className="text-3xl font-bold leading-none">{config.experienceYears}</p>
                      <p className="mt-1 text-xs font-medium leading-snug">
                        Years
                        <br />
                        Experience
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {config.aboutSecondaryImageUrl ? (
                <div className="absolute -bottom-6 left-0 w-[42%] overflow-hidden rounded-2xl border-4 border-background shadow-lg sm:-left-4 md:w-[38%]">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- CMS Cloudinary URL */}
                    <img
                      src={config.aboutSecondaryImageUrl}
                      alt=""
                      className="aspect-[3/4] w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary shadow-md">
                        <Play className="size-5 fill-current" aria-hidden />
                        <span className="sr-only">Play</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            {config.aboutSecondaryImageUrl ? <div className="h-8" aria-hidden /> : null}
          </div>
        )}
      </div>
    </section>
  );
}
