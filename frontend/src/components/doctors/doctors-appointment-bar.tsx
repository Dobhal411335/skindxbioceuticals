"use client";

import { MapPin, RotateCcw, UserRound } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIA_STATES } from "@/utils/state";

export type DoctorSearchFilters = {
  name: string;
  city: string;
  state: string;
};

type DoctorsAppointmentBarProps = {
  filters: DoctorSearchFilters;
  onFiltersChange: (filters: DoctorSearchFilters) => void;
  onSearch: (filters: DoctorSearchFilters) => void;
  onReset: () => void;
  hasActiveFilter: boolean;
  isSearching: boolean;
  stateSelectKey: number;
};

/**
 * Doctor search bar — name, city, and Indian state filters.
 */
export function DoctorsAppointmentBar({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  hasActiveFilter,
  isSearching,
  stateSelectKey,
}: DoctorsAppointmentBarProps) {
  const patch = (partial: Partial<DoctorSearchFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <section className="container-page py-10 md:py-14" aria-labelledby="find-doctor-heading">
      <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-[var(--shadow-card)] md:p-7">
        <h2
          id="find-doctor-heading"
          className="mb-5 text-xl font-bold tracking-tight text-foreground md:text-2xl"
        >
          Find a Doctor
        </h2>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(filters);
          }}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">Doctor name</span>
                <input
                  type="search"
                  name="doctor-name"
                  value={filters.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="e.g. Daisy Bins"
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-4" aria-hidden />
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">City</span>
                <input
                  type="search"
                  name="doctor-city"
                  value={filters.city}
                  onChange={(event) => patch({ city: event.target.value })}
                  placeholder="e.g. Mumbai"
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
              </span>
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">State</p>
                <Select
                  key={stateSelectKey}
                  value={filters.state || undefined}
                  onValueChange={(value) => patch({ state: value })}
                >
                  <SelectTrigger
                    id="doctor-state"
                    aria-label="State"
                    className="h-auto w-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 data-[size=default]:h-auto"
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIA_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
              </span>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 md:min-w-[8.5rem]"
            >
              {isSearching ? "Searching…" : "Search"}
            </button>
          </div>

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={onReset}
              disabled={isSearching}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset filter
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}
