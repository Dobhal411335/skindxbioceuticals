import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { DoctorProfile } from "@/types/doctors";

type DoctorsGridSectionProps = {
  doctors: DoctorProfile[];
};

function metaParts(doctor: DoctorProfile): string[] {
  const parts = [doctor.specialization];
  if (doctor.experienceYears > 0) {
    parts.push(`${doctor.experienceYears} yrs`);
  }
  parts.push(
    doctor.consultancyType === "ONLINE" ? "Online" : "By appointment",
  );
  return parts;
}

export function DoctorsGridSection({ doctors }: DoctorsGridSectionProps) {
  if (doctors.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-border/70 bg-surface/30 py-14 md:py-20"
      aria-labelledby="doctors-grid-heading"
    >
      <div className="container-page">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-primary" aria-hidden />
            Our Doctors
          </p>
          <h2
            id="doctors-grid-heading"
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Meet Our Specialists
          </h2>
        </div>

        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="group relative rounded-2xl border border-border/60 bg-background px-5 pb-6 pt-14 text-center shadow-[var(--shadow-card)] transition-colors duration-500 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <div className="size-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md transition-colors group-hover:border-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element -- CMS Cloudinary URL */}
                  <img
                    src={doctor.photoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary-foreground">
                {doctor.name}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                {metaParts(doctor).join(" / ")}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-primary-foreground/90">
                {doctor.about}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors group-hover:text-primary-foreground"
              >
                Appointment
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
