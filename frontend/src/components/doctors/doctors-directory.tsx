"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  DoctorsAppointmentBar,
  type DoctorSearchFilters,
} from "@/components/doctors/doctors-appointment-bar";
import { DoctorsGridSection } from "@/components/doctors/doctors-grid-section";
import type { DoctorProfile } from "@/types/doctors";

type DoctorsDirectoryProps = {
  doctors: DoctorProfile[];
};

const EMPTY_FILTERS: DoctorSearchFilters = {
  name: "",
  city: "",
  state: "",
};

function normalizeFilters(filters: DoctorSearchFilters): DoctorSearchFilters {
  return {
    name: filters.name.trim(),
    city: filters.city.trim(),
    state: filters.state.trim(),
  };
}

function hasFilters(filters: DoctorSearchFilters): boolean {
  const normalized = normalizeFilters(filters);
  return Boolean(normalized.name || normalized.city || normalized.state);
}

function matchesDoctor(
  doctor: DoctorProfile,
  filters: DoctorSearchFilters,
): boolean {
  const { name, city, state } = normalizeFilters(filters);

  if (name && !doctor.name.toLowerCase().includes(name.toLowerCase())) {
    return false;
  }
  if (city && !doctor.city.toLowerCase().includes(city.toLowerCase())) {
    return false;
  }
  if (state && doctor.state.toLowerCase() !== state.toLowerCase()) {
    return false;
  }

  return true;
}

function formatFilterSummary(filters: DoctorSearchFilters): string {
  const parts = [
    filters.name.trim() || null,
    filters.city.trim() || null,
    filters.state.trim() || null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function DoctorsDirectory({ doctors }: DoctorsDirectoryProps) {
  const [draft, setDraft] = useState<DoctorSearchFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<DoctorSearchFilters>(EMPTY_FILTERS);
  const [stateSelectKey, setStateSelectKey] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current != null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const filteredDoctors = doctors.filter((doctor) =>
    matchesDoctor(doctor, applied),
  );
  const hasActiveFilter = hasFilters(applied);
  const showSkeleton = isSearching || isPending;

  const runSearch = (nextFilters: DoctorSearchFilters) => {
    const normalized = normalizeFilters(nextFilters);
    setDraft({
      name: nextFilters.name,
      city: nextFilters.city,
      state: normalized.state,
    });

    if (searchTimeoutRef.current != null) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => {
        setApplied(normalized);
        setIsSearching(false);
      });
    }, 280);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setStateSelectKey((key) => key + 1);
    runSearch(EMPTY_FILTERS);
  };

  return (
    <>
      <DoctorsAppointmentBar
        filters={draft}
        onFiltersChange={setDraft}
        onSearch={runSearch}
        onReset={handleReset}
        hasActiveFilter={hasActiveFilter || hasFilters(draft)}
        isSearching={showSkeleton}
        stateSelectKey={stateSelectKey}
      />
      <DoctorsGridSection
        doctors={filteredDoctors}
        allDoctors={doctors}
        isLoading={showSkeleton}
        hasActiveFilter={hasActiveFilter}
        searchQuery={formatFilterSummary(applied)}
        onResetFilter={handleReset}
      />
    </>
  );
}
