import { type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function StatCards({ items, className }: { items: StatCardItem[]; className?: string }) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
      data-testid="stat-cards"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.id} className="shadow-(--shadow-card)">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
              {item.hint ? <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p> : null}
            </CardContent>
          </Card>
        );
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
