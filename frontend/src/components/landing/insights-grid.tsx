"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import type {
  StorefrontInsightCard,
  StorefrontInsights,
} from "@/types/insights";

function formatInsightDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function InsightCardItem({ card }: { card: StorefrontInsightCard }) {
  const [open, setOpen] = useState(false);
  const hasImage = Boolean(card.imageUrl.trim());
  const fullHtml =
    card.descriptionHtml?.trim() ||
    (card.excerpt ? `<p>${card.excerpt}</p>` : "");

  return (
    <article className="flex h-full flex-col rounded-lg border border-border overflow-hidden">
      <div className="group relative aspect-4/3 overflow-hidden bg-surface">
        {hasImage ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            No image
          </div>
        )}
        {card.category ? (
          <span className="absolute top-3 left-3 bg-foreground px-2.5 py-1 text-[11px] font-medium tracking-wide text-background uppercase">
            {card.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-4">
        <h3 className="font-display text-lg leading-snug font-semibold text-foreground">
          {card.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatInsightDate(card.publishedAt)}
        </p>

        {!open ? (
          <>
            {card.excerpt ? (
              <p className="mt-1 line-clamp-3 text-justify text-sm leading-relaxed text-muted-foreground">
                {card.excerpt}
              </p>
            ) : null}
            {fullHtml ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-auto pt-3 text-left text-xs font-bold tracking-[0.12em] text-foreground uppercase underline decoration-primary decoration-1 underline-offset-4 transition-colors hover:text-primary"
              >
                Read more{" "}
                <ArrowRight className="inline-block size-4" aria-hidden />
              </button>
            ) : null}
          </>
        ) : (
          <div className="mt-1 space-y-3">
            <div
              className="rich-html text-justify text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]"
              dangerouslySetInnerHTML={{ __html: fullHtml }}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-left text-xs font-bold tracking-[0.12em] text-foreground uppercase underline decoration-primary decoration-1 underline-offset-4 transition-colors hover:text-primary"
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

type InsightsGridProps = {
  insights?: StorefrontInsights;
};

export function InsightsGrid({ insights }: InsightsGridProps) {
  const cards = insights?.cards ?? [];
  if (cards.length === 0)  return null;

  return (
    <section className="container-page section-space" aria-labelledby="insights-heading">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <InsightCardItem key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
