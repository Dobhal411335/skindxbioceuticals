"use client";

import { Package } from "lucide-react";

import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminModuleDefinition } from "@/config/admin-modules";
import type { SiteCode } from "@/types/auth";

interface ModulePageShellProps {
  siteCode: SiteCode;
  module: AdminModuleDefinition;
}

export function ModulePageShell({ siteCode, module }: ModulePageShellProps) {
  const siteLabel = siteCode === "IN" ? "India · .in" : "India · .com";

  return (
    <AdminAppShell
      siteCode={siteCode}
      title={module.label}
      description={module.description}
    >
      <Card className="shadow-(--shadow-card)" data-testid="module-page-shell">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{siteLabel}</Badge>
            <Badge variant="outline">Awaiting data integration</Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="size-5 text-primary" />
            {module.label}
          </CardTitle>
          <CardDescription>{module.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This is a navigable interface for{" "}
            <span className="font-medium text-foreground">{module.label}</span> in the{" "}
            <span className="font-medium text-foreground">{siteLabel}</span> workspace. Routing,
            breadcrumbs, and site context are available now.
          </p>
          <p>
            Full operational workflows will be added when this module is connected to backend APIs.
            No placeholder records or fabricated business data are shown. Authorization and site
            permissions remain enforced by the API.
          </p>
        </CardContent>
      </Card>
    </AdminAppShell>
  );
}
