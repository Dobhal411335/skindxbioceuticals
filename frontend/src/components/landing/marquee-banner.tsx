import { marqueeItems } from "@/data/landing";

export function MarqueeBanner() {
  const sequence = [...marqueeItems, ...marqueeItems];

  return (
    <section
      aria-label="Store announcements"
      className="overflow-hidden bg-primary/15 py-3 text-foreground"
    >
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {sequence.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-8 text-sm font-medium tracking-wide"
          >
            {item}
            <span aria-hidden className="text-primary">
              ·
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
