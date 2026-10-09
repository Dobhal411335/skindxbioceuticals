import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { testimonials } from "@/data/landing";

export function TestimonialsGrid() {
  return (
    <section
      className="border-y border-border bg-surface/50"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-page section-space">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Customer feedback layout
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Sample quotes for UI demonstration only — not verified clinical outcomes.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item) => (
            <figure key={item.id} className="flex flex-col gap-4">
              <div className="flex gap-0.5 text-amber-500" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90 italic">
                “{item.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={item.avatar} alt="" />
                  <AvatarFallback>{item.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">From {item.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
