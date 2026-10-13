"use client";

import { CalendarDays, Mail, Phone } from "lucide-react";

/**
 * UI-only appointment search bar (no backend search this pass).
 * Matches the book-appointment reference layout with SkinDx tokens.
 */
export function DoctorsAppointmentBar() {
  return (
    <section className="container-page py-10 md:py-14" aria-labelledby="book-appointment-heading">
      <div className="rounded-2xl border border-border/70 bg-background p-5 shadow-[var(--shadow-card)] md:p-7">
        <h2
          id="book-appointment-heading"
          className="mb-5 text-xl font-bold tracking-tight text-foreground md:text-2xl"
        >
          Book an Appointment
        </h2>

        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Email Address</span>
              <input
                type="email"
                name="email"
                defaultValue=""
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Mail className="size-4" aria-hidden />
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Appointment Date</span>
              <input
                type="date"
                name="date"
                className="w-full bg-transparent text-sm font-semibold text-foreground outline-none"
              />
            </span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Phone No</span>
              <input
                type="tel"
                name="phone"
                defaultValue=""
                placeholder="+91 …"
                className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Phone className="size-4" aria-hidden />
            </span>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover md:min-w-[8.5rem]"
          >
            Book Now
          </button>
        </form>
      </div>
    </section>
  );
}
