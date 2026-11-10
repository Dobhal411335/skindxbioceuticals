// @ts-nocheck — ported from Hotel WebPage.jsx; keep visual parity.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Quote,
} from "lucide-react";
import {
  AuthorCard,
  ContentImageFrame,
  GetInTouchCard,
  HtmlBlock,
  ImageDotsCarousel,
  ShareCard,
  StaticSidebarCard,
  WebpageHero,
  cleanObjectArray,
  cleanTextArray,
  formatDate,
  isFilledText,
} from "@/features/webpages/webpage-shared";
import type { StorefrontWebpage } from "@/features/webpages/webpage.types";
import Image from "next/image";



export function Design5Page({ data }: { data: StorefrontWebpage }) {
  const designHeaderDesktop =
    data.bannerImage?.url ||
    data.imageFirst?.url ||
    data.bannerImageMobile?.url ||
    data.imageFirstMobile?.url ||
    "";
  const designHeaderMobile =
    data.bannerImageMobile?.url ||
    data.imageFirstMobile?.url ||
    data.bannerImage?.url ||
    data.imageFirst?.url ||
    "";

return (
      <div className="min-h-screen bg-[#f8f5ee] text-[#172d35]">
        <WebpageHero
          miniHeading={data.heroMiniHeading}
          mainHeading={data.heroMainHeading}
          description={data.heroDescription}
          desktopImageUrl={designHeaderDesktop}
          mobileImageUrl={designHeaderMobile}
        />

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Top Text Section */}
          <div className="mb-12 max-w-3xl">
            {isFilledText(data.design5Chip) && (
              <div className="inline-block border border-gray-400 rounded-full px-4 py-1 text-sm font-medium text-gray-600 mb-6">
                {data.design5Chip}
              </div>
            )}

            {isFilledText(data.design5MainHeading) && (
              <h2 className="text-2xl md:text-4xl font-serif text-gray-800 leading-snug">
                {data.design5MainHeading}
              </h2>
            )}
          </div>

          {/* Grid Cards Section */}
          {data.gridCards?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {data.gridCards.map((card, idx) => (
                <div key={idx} className="group flex flex-col cursor-pointer">
                  <div className="mb-6 w-full">
                    {card.image?.url ? (
                      <ContentImageFrame className="h-64 md:h-80">
                        <Image
                          src={card.image.url}
                          alt={card.title || "Card image"}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </ContentImageFrame>
                    ) : (
                      <div className="flex h-64 w-full items-center justify-center bg-gray-200 text-gray-400 md:h-80">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      {isFilledText(card.chipName) && (
                        <div className="inline-block border border-gray-400 rounded-full px-3 py-0.5 text-xs font-medium text-gray-600 mb-4">
                          {card.chipName}
                        </div>
                      )}

                      <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                        {card.title}
                      </h3>
                    </div>

                    {isFilledText(card.link) && (
                      <a
                        href={card.link}
                        className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black mt-2"
                      >
                        Explore More
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* <PopularDestinations /> */}
      </div>
    );
  
}
