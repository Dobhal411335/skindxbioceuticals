"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { DoctorAppointmentModal } from "@/components/doctors/doctor-appointment-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { DoctorProfile } from "@/types/doctors";

type DoctorsGridSectionProps = {
  doctors: DoctorProfile[];
  allDoctors: DoctorProfile[];
  isLoading?: boolean;
  hasActiveFilter?: boolean;
  searchQuery?: string;
  onResetFilter?: () => void;
};

function metaParts(doctor: DoctorProfile): string[] {
  const parts = [doctor.specialization];
  if (doctor.experienceYears > 0) {
    parts.push(`${doctor.experienceYears} yrs`);
  }
  const location = [doctor.city, doctor.state].filter(Boolean).join(", ");
  if (location) {
    parts.push(location);
  }
  return parts;
}

function DoctorCardSkeleton() {
  return (
    <article className="relative rounded-2xl border border-border/60 bg-background px-5 pb-6 pt-14 text-center shadow-[var(--shadow-card)]">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <Skeleton className="size-24 rounded-full border-4 border-background" />
      </div>
      <Skeleton className="mx-auto h-5 w-36" />
      <Skeleton className="mx-auto mt-3 h-3 w-44" />
      <Skeleton className="mx-auto mt-4 h-3 w-full max-w-[14rem]" />
      <Skeleton className="mx-auto mt-2 h-3 w-full max-w-[12rem]" />
      <Skeleton className="mx-auto mt-5 h-4 w-24" />
    </article>
  );
}

export function DoctorsGridSection({
  doctors,
  allDoctors,
  isLoading = false,
  hasActiveFilter = false,
  searchQuery = "",
  onResetFilter,
}: DoctorsGridSectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  if (!isLoading && !hasActiveFilter && doctors.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t border-border/70 bg-surface/30 py-14 md:py-20"
      aria-labelledby="doctors-grid-heading"
      aria-busy={isLoading}
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
          {hasActiveFilter && !isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {doctors.length === 0
                ? `No results for “${searchQuery.trim()}”`
                : `${doctors.length} result${doctors.length === 1 ? "" : "s"} for “${searchQuery.trim()}”`}
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <div
            className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-label="Loading doctors"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <DoctorCardSkeleton key={index} />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border/70 bg-background px-6 py-12 text-center shadow-[var(--shadow-card)]">
            <p className="text-lg font-semibold text-foreground">Doctor not found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              No doctor matched your search
              {searchQuery.trim() ? (
                <>
                  {" "}
                  for <span className="font-medium text-foreground">“{searchQuery.trim()}”</span>
                </>
              ) : null}
              . Try another name, city, or state.
            </p>
            {onResetFilter ? (
              <button
                type="button"
                onClick={onResetFilter}
                className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Reset filter
              </button>
            ) : null}
          </div>
        ) : (
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
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctorId(doctor.id);
                    setOpen(true);
                  }}
                  className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary transition-colors group-hover:text-primary-foreground hover:underline"
                >
                  Appointment
                  <ArrowUpRight className="size-4" aria-hidden />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <DoctorAppointmentModal
        open={open}
        onOpenChange={setOpen}
        doctors={allDoctors}
        initialDoctorId={selectedDoctorId}
      />
    </section>
  );
}
