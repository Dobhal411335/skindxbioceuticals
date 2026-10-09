import { BadgePercent, Gift, Package, ShieldCheck } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { trustIcons, trustItems } from "@/data/landing";

const icons = {
  shield: ShieldCheck,
  package: Package,
  gift: Gift,
  badge: BadgePercent,
} as const;

export function TrustBenefitsBar() {
  return (
    <section aria-label="Store benefits" className="border-b border-border">
      <div className="bg-surface-warm">
        <div className="container-page grid divide-y divide-border/80 md:grid-cols-2 md:divide-x md:divide-y-0">
          {trustItems.map((item) => (
            <div key={item.title} className="px-4 py-6 text-center md:px-8">
              <p className="text-sm font-semibold tracking-wide uppercase">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {trustIcons.map((item, index) => {
          const Icon = icons[item.icon];
          return (
            <div key={item.title} className="flex items-center justify-center gap-3 lg:px-4">
              {index > 0 ? (
                <Separator
                  orientation="vertical"
                  className="mr-4 hidden h-8 lg:block"
                />
              ) : null}
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <p className="text-xs font-semibold tracking-wide uppercase">
                {item.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
