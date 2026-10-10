"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, Globe2, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthSite, SiteCode } from "@/types/auth";

interface SiteSelectorCardsProps {
  sites: AuthSite[];
}

const SITE_COPY: Record<
  SiteCode,
  {
    title: string;
    label: string;
    description: string;
    cta: string;
    image: string;
    accent: string;
    icon: typeof ShoppingBag;
  }
> = {
  IN: {
    title: "SkinDx India",
    label: "Ecommerce website · .in",
    description: "Manage ecommerce operations, catalog, orders, payments, and customers.",
    cta: "Manage India Website",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    accent: "from-[#287F79]/90 to-[#1D3B68]/80",
    icon: ShoppingBag,
  },
  COM: {
    title: "SkinDx Global",
    label: "Corporate / enquiry website · .com",
    description: "Manage website content, company information, banners, and enquiries.",
    cta: "Manage Global Website",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    accent: "from-[#1D3B68]/90 to-[#0f1f36]/85",
    icon: Globe2,
  },
};

export function SiteSelectorCards({ sites }: SiteSelectorCardsProps) {
  const router = useRouter();
  const authorized = new Set(sites.map((site) => site.code));

  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="site-selector">
      {(["IN", "COM"] as SiteCode[]).map((code) => {
        const copy = SITE_COPY[code];
        const Icon = copy.icon;
        const canAccess = authorized.has(code);

        return (
          <Card
            key={code}
            className="overflow-hidden border-0 shadow-(--shadow-card) ring-1 ring-border/60"
            data-testid={`site-card-${code}`}
            data-authorized={canAccess ? "true" : "false"}
          >
            <div className="relative h-44 overflow-hidden">
              <Image
                src={copy.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className={`absolute inset-0 bg-linear-to-br ${copy.accent}`} />
              <div className="absolute inset-0 flex items-end p-5 text-white">
                <div className="space-y-1">
                  <Badge className="bg-white/15 text-white hover:bg-white/20">{copy.label}</Badge>
                  <h2 className="text-2xl font-semibold tracking-tight">{copy.title}</h2>
                </div>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="size-5 text-primary" />
                {code === "IN" ? "Ecommerce operations" : "Content & enquiries"}
              </CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {canAccess ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push(`/admin/${code.toLowerCase()}/dashboard`)}
                >
                  {copy.cta}
                </Button>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Building2 className="mt-0.5 size-4 shrink-0" />
                  You do not have permission for this website. Contact a Super Admin if access is
                  required.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
