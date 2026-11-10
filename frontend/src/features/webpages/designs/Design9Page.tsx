// @ts-nocheck — ported from Hotel WebPage.jsx; keep visual parity.
"use client";

import {
  HtmlBlock,
  ImageDotsCarousel,
  WebpageHero,
  isFilledText,
} from "@/features/webpages/webpage-shared";
import type { StorefrontWebpage } from "@/features/webpages/webpage.types";

export function Design9Page({ data }: { data: StorefrontWebpage }) {
  const contentCards = (data.design9Cards || []).filter(
    (card) =>
      isFilledText(card?.heading) ||
      isFilledText(card?.description) ||
      (Array.isArray(card?.images) && card.images.some((img) => img?.url)),
  );

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[#172d35]">
      <WebpageHero
        miniHeading={data.design9MiniHeading}
        mainHeading={data.design9MainHeading}
        description={data.design9Description}
        desktopImageUrl={data.bannerImage?.url || data.imageFirst?.url || ""}
        mobileImageUrl={
          data.bannerImageMobile?.url || data.imageFirstMobile?.url || ""
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {contentCards.length > 0 && (
          <div className="space-y-16 md:space-y-20">
            {contentCards.map((card, idx) => {
              const reverse = idx % 2 === 1;
              return (
                <section
                  key={`${card.heading}-${idx}`}
                  className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12"
                >
                  <div
                    className={`min-w-0 flex-1 ${reverse ? "lg:order-2" : "lg:order-1"}`}
                  >
                    {isFilledText(card.heading) && (
                      <h2 className="text-3xl font-semibold tracking-[-.03em] text-[#172d35]">
                        {card.heading}
                      </h2>
                    )}
                    {isFilledText(card.description) && (
                      <HtmlBlock
                        html={card.description}
                        className="mt-4 text-[#637179] [&_p]:text-base [&_p]:leading-8"
                      />
                    )}
                  </div>

                  <div
                    className={`w-full shrink-0 lg:sticky lg:top-28 lg:w-[min(100%,520px)] ${reverse ? "lg:order-1" : "lg:order-2"}`}
                  >
                    <ImageDotsCarousel
                      images={card.images}
                      alt={card.heading || data.title || "Section image"}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
