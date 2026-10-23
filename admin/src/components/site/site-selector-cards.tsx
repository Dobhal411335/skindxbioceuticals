"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, LayoutTemplate, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";

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
    title: "SkinDXBioceuticals.in",
    label: "India ecommerce",
    description:
      "Manage products, categories, inventory, orders, payments, customers, and ecommerce operations.",
    cta: "Manage SkinDXBioceuticals.in Website",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    accent: "from-[#287F7B]/90 to-[#183453]/80",
    icon: ShoppingBag,
  },
  COM: {
    title: "SkinDXBioceuticals.com",
    label: "India corporate website",
    description:
      "Manage company information, website pages, banners, product information, content, and enquiries.",
    cta: "Manage SkinDXBioceuticals.com Website",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    accent: "from-[#183453]/90 to-[#102E2A]/85",
    icon: LayoutTemplate,
  },
};

export function SiteSelectorCards({ sites }: SiteSelectorCardsProps) {
  const router = useRouter();
  const authorized = new Set(sites.map((site) => site.code));
  const [navigating, setNavigating] = useState<SiteCode | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="site-selector">
      {(["IN", "COM"] as SiteCode[]).map((code) => {
        const copy = SITE_COPY[code];
        const Icon = copy.icon;
        const canAccess = authorized.has(code);
        const isNavigating = navigating === code;

        return (
          <Card
            key={code}
            className="flex h-full flex-col overflow-hidden border-0 shadow-(--shadow-card) ring-1 ring-border/60 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring"
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
            <CardHeader className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="size-5 text-primary" />
                {code === "IN" ? "Ecommerce workspace" : "Corporate workspace"}
              </CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {canAccess ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={navigating !== null}
                  onClick={() => {
                    setNavigating(code);
                    router.push(`/admin/${code.toLowerCase()}/dashboard`);
                  }}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Opening…
                    </>
                  ) : (
                    copy.cta
                  )}
                </Button>
              ) : (
                <div className="flex items-start gap-2 rounded-[10px] bg-muted px-3 py-2.5 text-sm text-muted-foreground">
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
