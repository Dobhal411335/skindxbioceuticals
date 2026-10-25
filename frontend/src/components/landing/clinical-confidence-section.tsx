import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StorefrontClinicalConfidence } from "@/types/clinical-confidence";

export function ClinicalConfidenceSection({ config }: { config: StorefrontClinicalConfidence }) {
  const cards = config.cards.slice(0, 2);
  return (
    <section
      className="border-y border-[#e7e4dc] bg-[#f7f6f2] py-6 sm:py-8"
      aria-labelledby="clinical-confidence-heading"
    >
      <div className="container-page grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.45fr)_minmax(0,0.72fr)] lg:items-stretch">
        {cards[0] ? <ConfidenceCard card={cards[0]} /> : <div />}
        <div className="relative flex min-h-[26rem] flex-col justify-center overflow-hidden rounded-[8px] border border-[#e1e4df] px-8 py-10 text-[#173a56] shadow-sm sm:px-10">
          {config.backgroundImageUrl ? (
            <Image
              src={config.backgroundImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          ) : null}
           <div className="relative z-10">
            {config.badgeText ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0e6d77] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[#b6f1e8] uppercase">
                <span className="size-2 rounded-full bg-[#6dd8c8]" />
                {config.badgeText}
              </span>
            ) : null}
            <h2
              id="clinical-confidence-heading"
              className="mt-7 max-w-2xl text-4xl leading-[1.06] font-semibold tracking-[-0.04em] sm:text-5xl"
            >
              {config.heading}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#536a75] sm:text-lg">
              {config.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {config.button1Label ? (
                <Button
                  asChild
                  className="rounded-[3px] bg-[#2e9b95] px-6 py-5 font-semibold text-white hover:bg-[#267f7a]"
                >
                  <Link href={config.button1Url || "#"}>
                    {config.button1Label}
                    <ArrowUpRight className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : null}
              {config.button2Label ? (
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-[3px] px-5 py-5 font-semibold text-[#173a56] hover:bg-[#173a56]/10 hover:text-[#173a56]"
                >
                  <Link href={config.button2Url || "#"}>
                    {config.button2Label}
                    <ArrowUpRight className="ml-2 size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {cards[1] ? <ConfidenceCard card={cards[1]} /> : <div />}
      </div>
    </section>
  );
}

function ConfidenceCard({ card }: { card: StorefrontClinicalConfidence["cards"][number] }) {
  return (
    <article className="flex min-h-[26rem] flex-col rounded-[8px] border border-[#e8e5df] bg-white p-4 shadow-sm">
      <div className="relative aspect-[0.92] overflow-hidden rounded-[3px] bg-[#eef0ed]">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.heading}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 25vw"
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[0.04em] text-[#176e73] uppercase">
          <CheckCircle2 className="size-4" />
          {card.heading}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#647178]">{card.description}</p>
        {card.buttonLabel ? (
          <Link
            href={card.buttonUrl || "#"}
            className="mt-auto pt-5 text-xs font-semibold text-[#176e73] hover:underline"
          >
            {card.buttonLabel} <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
