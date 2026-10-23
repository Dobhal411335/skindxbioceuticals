import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
}

export function StatCards({ items, className }: { items: StatCardItem[]; className?: string }) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
      data-testid="stat-cards"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <Card
            className={cn(
              "shadow-(--shadow-card) transition-all duration-200 h-full",
              item.href && "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 group cursor-pointer",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <CardTitle
                  className={cn(
                    "text-sm font-medium text-muted-foreground truncate",
                    item.href && "group-hover:text-foreground transition-colors",
                  )}
                >
                  {item.label}
                </CardTitle>
                {item.href ? (
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-40 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                ) : null}
              </div>
              <Icon
                className={cn(
                  "size-4 text-primary shrink-0 transition-transform duration-200",
                  item.href && "group-hover:scale-110",
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
              {item.hint ? <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p> : null}
            </CardContent>
          </Card>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {inner}
            </Link>
          );
        }

        return <div key={item.id}>{inner}</div>;
      })}
    </div>
  );
}

export function StatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="stat-cards-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader>
            <div className="h-4 w-24 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
