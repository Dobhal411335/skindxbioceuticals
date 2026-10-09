import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Gift, Package, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  hero,
  heroAssociateFallback,
  heroBanners,
  type HeroBanner,
} from "@/data/landing";

const trustIcons = {
  gift: Gift,
  package: Package,
  badge: BadgePercent,
  shield: ShieldCheck,
} as const;

type HeroSectionProps = {
  /** Backend/CMS banners. When empty, the associate-brand fallback is shown. */
  banners?: HeroBanner[];
};

function BackendHeroBanners({ banners }: { banners: HeroBanner[] }) {
  return (
    <div className="grid gap-0 lg:grid-cols-2">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.href}
          className="group relative block min-h-[18rem] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={banner.image}
            alt={banner.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-secondary/55" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 text-secondary-foreground">
            <h2 className="font-display text-3xl font-semibold">{banner.title}</h2>
            {banner.subtitle ? (
              <p className="mt-2 max-w-md text-sm text-secondary-foreground/90">
                {banner.subtitle}
              </p>
            ) : null}
            <span className="mt-4 text-sm font-semibold underline-offset-4 group-hover:underline">
              {banner.ctaLabel ?? "Shop now"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AssociateBrandFallback() {
  const { trustStrip, title, body, cta, partners } = heroAssociateFallback;

  return (
    <div className="border-b border-border">
      <div className="bg-surface">
        <div className="container-page grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {trustStrip.map((item, index) => {
            const Icon = trustIcons[item.icon];
            return (
              <div
                key={item.title}
                className="relative flex items-center justify-center gap-2 px-3 py-1"
              >
                {index > 0 ? (
                  <Separator
                    orientation="vertical"
                    className="absolute top-1/2 left-0 hidden h-6 -translate-y-1/2 lg:block"
                  />
                ) : null}
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-[11px] font-semibold tracking-wide text-foreground uppercase">
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-secondary text-secondary-foreground">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
          <div className="max-w-md">
            <h2 className="text-3xl font-medium tracking-tight lowercase sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-secondary-foreground/90 sm:text-base">
              {body}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-full border-transparent bg-[#ff6a00] px-8 text-white hover:bg-[#e55f00]"
            >
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>

          <div
            className="grid grid-cols-2 overflow-hidden rounded-sm border border-white/40 bg-white"
            role="list"
            aria-label="Associate brands"
          >
            {partners.map((partner, index) => (
              <div
                key={partner.id}
                role="listitem"
                className={[
                  "flex aspect-square flex-col items-center justify-center gap-2 bg-white p-6 text-foreground",
                  index % 2 === 0 ? "border-r border-secondary/20" : "",
                  index < 2 ? "border-b border-secondary/20" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="flex size-14 items-center justify-center rounded-full border border-border text-sm font-bold tracking-wide"
                  aria-hidden
                >
                  {partner.mark}
                </span>
                <p className="text-center text-xs font-semibold tracking-wide uppercase">
                  {partner.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultTripleHero() {
  return (
    <div className="grid min-h-[28rem] lg:min-h-[34rem] lg:grid-cols-3">
      <div className="relative hidden min-h-[16rem] md:block lg:min-h-0">
        <Image
          src={hero.leftImage.src}
          alt={hero.leftImage.alt}
          fill
          className="object-cover"
          sizes="33vw"
          priority
        />
      </div>

      <div className="flex flex-col items-center justify-center bg-primary px-6 py-16 text-center text-primary-foreground sm:px-10">
        <p className="text-sm tracking-wide">{hero.eyebrow}</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {hero.title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
          {hero.body}
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/40 bg-primary-foreground text-primary hover:bg-transparent hover:text-primary-foreground"
          >
            <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
          </Button>
        </div>
      </div>

      <div className="relative min-h-[16rem] lg:min-h-0">
        <Image
          src={hero.rightImage.src}
          alt={hero.rightImage.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
          priority
        />
      </div>
    </div>
  );
}

export function HeroSection({ banners = heroBanners }: HeroSectionProps) {
  const hasBannerData = banners.length > 0;

  return (
    <section aria-label="Hero" className="border-b border-border">
      {hasBannerData ? <BackendHeroBanners banners={banners} /> : null}
      {!hasBannerData ? <AssociateBrandFallback /> : null}
      {!hasBannerData ? <DefaultTripleHero /> : null}
    </section>
  );
}
