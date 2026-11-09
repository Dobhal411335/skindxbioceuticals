"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import type { DoctorSearchFilters } from "@/components/doctors/doctors-appointment-bar";
import { DoctorAppointmentModal } from "@/components/doctors/doctor-appointment-modal";
import { DoctorProfileModal } from "@/components/doctors/doctor-profile-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDoctorDisplayName, type DoctorProfile } from "@/types/doctors";

type DoctorsGridSectionProps = {
  doctors: DoctorProfile[];
  allDoctors: DoctorProfile[];
  isLoading?: boolean;
  hasActiveFilter?: boolean;
  searchQuery?: string;
  onResetFilter?: () => void;
  onApplyProfileFilter?: (filters: Partial<DoctorSearchFilters>) => void;
};

function doctorSubtitle(doctor: DoctorProfile): string {
  if (doctor.degree.trim()) return doctor.degree.trim();
  if (doctor.specializations.length > 1) {
    return doctor.specializations.slice(1).join(" · ");
  }
  if (doctor.about.trim()) return doctor.about.trim();
  return [doctor.city, doctor.state].filter(Boolean).join(", ");
}

function DoctorCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[var(--shadow-card)]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-10 w-36" />
      </div>
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
  onApplyProfileFilter,
}: DoctorsGridSectionProps) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [profileDoctorId, setProfileDoctorId] = useState<string | null>(null);

  if (!isLoading && !hasActiveFilter && doctors.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-[#f8f5ee] py-10"
      aria-labelledby="doctors-grid-heading"
      aria-busy={isLoading}
    >
      <div className="container-page">
        <div className="mb-10 text-center md:mb-12">
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
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
              . Try another name, speciality, state, or city.
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {doctors.map((doctor) => {
              const specialty = doctor.specializations[0] ?? "";
              const subtitle = doctorSubtitle(doctor);

              return (
                <article
                  key={doctor.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/4] overflow-hidden bg-muted">
                    <Image
                      src={doctor.photoUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      quality={90}
                      loading="lazy"
                      className="object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-3 text-left">
                    {specialty ? (
                      <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
                        {specialty}
                      </p>
                    ) : null}

                    <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                      {formatDoctorDisplayName(doctor.name)}
                    </h3>

                    <div className="mt-2 h-px w-full bg-border" aria-hidden />

                    {subtitle ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {subtitle}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDoctorId(doctor.id);
                          setProfileOpen(true);
                        }}
                        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                      >
                        View Profile
                        <ArrowUpRight className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctorId(doctor.id);
                          setOpen(true);
                        }}
                        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Book Appointment
                        <ArrowUpRight className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <DoctorProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        doctor={
          doctors.find((item) => item.id === profileDoctorId) ??
          allDoctors.find((item) => item.id === profileDoctorId) ??
          null
        }
        onSelectSpecialization={(specialization) => {
          setProfileOpen(false);
          onApplyProfileFilter?.({ speciality: specialization });
        }}
        onSelectLocation={({ state, city }) => {
          setProfileOpen(false);
          onApplyProfileFilter?.({ state, city });
        }}
        onBookAppointment={(doctor) => {
          setProfileOpen(false);
          setSelectedDoctorId(doctor.id);
          // Open booking after profile dialog starts closing so both don't fight focus.
          window.setTimeout(() => setOpen(true), 150);
        }}
      />
      <DoctorAppointmentModal
        open={open}
        onOpenChange={setOpen}
        doctors={allDoctors}
        initialDoctorId={selectedDoctorId}
      />
    </section>
  );
}
