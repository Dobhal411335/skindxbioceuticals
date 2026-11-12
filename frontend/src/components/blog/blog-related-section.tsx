"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatBlogDate } from "@/features/blog/blog-format";
import type { StorefrontBlogCard } from "@/types/blog";

const RELATED_BLOG_LIMIT = 6;

type BlogRelatedSectionProps = {
  /** Candidate blogs (already excluding the current article). */
  items: StorefrontBlogCard[];
};

function shuffleCards(items: StorefrontBlogCard[]): StorefrontBlogCard[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i]!;
    next[i] = next[j]!;
    next[j] = current;
  }
  return next;
}

export function BlogRelatedSection({ items }: BlogRelatedSectionProps) {
  const [cards, setCards] = useState<StorefrontBlogCard[]>([]);

  useEffect(() => {
    setCards(shuffleCards(items).slice(0, RELATED_BLOG_LIMIT));
  }, [items]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full border-t border-[#eadfce] bg-[#f4ebe1]"
      aria-labelledby="blog-related-heading"
    >
      <div className="container-page section-space py-12 sm:py-16 lg:py-20">
        <h2
          id="blog-related-heading"
          className="text-2xl font-semibold tracking-tight text-[#1d262b] sm:text-3xl"
        >
          You might also like
        </h2>

        <ul className="mt-8 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {cards.map((entry) => (
            <li key={entry.id} className="h-full">
              <Link
                href={`/blog/${entry.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(40,30,20,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c97852]"
              >
                <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-[#f3ebe1]">
                  <Image
                    src={
                      entry.imageUrl ||
                      "https://placehold.co/800x600/png?text=SkinDx+Blog"
                    }
                    alt={entry.title || entry.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="line-clamp-1 text-[11px] font-semibold tracking-[0.14em] text-[#c97852] uppercase">
                    {entry.category || "Blog"}
                  </p>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-base font-semibold leading-snug text-[#1d262b] transition-colors group-hover:text-[#c97852] sm:min-h-[2.75rem] sm:text-lg">
                    {entry.title || entry.name}
                  </p>
                  <p className="mt-auto line-clamp-1 pt-2 text-xs tracking-wide text-[#6d787e] uppercase">
                    {formatBlogDate(entry.publishedAt)}
                    {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
