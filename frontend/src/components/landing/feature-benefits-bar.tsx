import { CreditCard, ShieldCheck, Truck, Wallet } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { featureBenefits } from "@/data/landing";

const icons = {
  truck: Truck,
  shield: ShieldCheck,
  wallet: Wallet,
  card: CreditCard,
} as const;

export function FeatureBenefitsBar() {
  return (
    <section
      className="border-y border-border"
      aria-label="Shopping benefits"
    >
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {featureBenefits.map((item, index) => {
          const Icon = icons[item.icon];
          return (
            <div key={item.title} className="relative flex gap-4 px-2 lg:px-6">
              {index > 0 ? (
                <Separator
                  orientation="vertical"
                  className="absolute top-0 left-0 hidden h-full lg:block"
                />
              ) : null}
              <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
