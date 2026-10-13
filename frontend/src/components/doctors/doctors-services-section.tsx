import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  DOCTOR_SERVICE_ICON_TONES,
  getDoctorServiceIcon,
} from "@/features/doctors/doctor-service-icons";
import type { DoctorPageConfig } from "@/types/doctors";

type DoctorsServicesSectionProps = {
  config: DoctorPageConfig;
};

export function DoctorsServicesSection({ config }: DoctorsServicesSectionProps) {
  const services = config.services.filter((service) => service.active);
  if (
    !config.servicesHeading &&
    !config.servicesSubheading &&
    services.length === 0
  ) {
    return null;
  }

  return (
    <section
      className="border-t border-border/70 bg-surface/40 py-14 md:py-20"
      aria-labelledby="doctors-services-heading"
    >
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-primary" aria-hidden />
              Our Service
            </p>
            {config.servicesHeading ? (
              <h2
                id="doctors-services-heading"
                className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              >
                {config.servicesHeading}
              </h2>
            ) : null}
          </div>
          {config.servicesSubheading ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground lg:text-right">
              {config.servicesSubheading}
            </p>
          ) : null}
        </div>

        {services.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = getDoctorServiceIcon(service.iconKey);
              const tone =
                DOCTOR_SERVICE_ICON_TONES[index % DOCTOR_SERVICE_ICON_TONES.length]!;
              const href = service.readMoreUrl?.trim() || "#";

              return (
                <article
                  key={service.id}
                  className="rounded-2xl border border-border/60 bg-background p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-full shadow-[0_0_20px] ${tone}`}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="text-base font-semibold text-foreground">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <Link
                    href={href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    Read More
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
