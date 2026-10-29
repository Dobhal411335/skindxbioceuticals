"use client";

import { ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { PublicProductHighlight } from "@/types/product";

type ProductHighlightsProps = {
  highlights: PublicProductHighlight[];
};

export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (highlights.length === 0) return null;

  return (
    <section
      className="w-full bg-[#f7f3eb] py-16 sm:py-20 lg:py-24"
      aria-labelledby="product-highlights-heading"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-[#a8735d] uppercase">
            <span className="h-px w-8 bg-[#a8735d]" aria-hidden />
            Product questions
          </div>
          <h2
            id="product-highlights-heading"
            className="mt-7 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.04em] text-[#1c2a2e] sm:text-5xl lg:text-6xl"
          >
            Frequently asked
            <br />
            questions
          </h2>
          <p className="mt-8 max-w-md text-base leading-7 text-[#6c7a7d] sm:text-lg">
            Everything you need to know about this product, from how to use it to what makes it
            right for your routine.
          </p>
        </div>

        <div className="overflow-y-auto pr-1 sm:pr-3">
          <div className="border-t border-[#d9cbbd]">
            {highlights.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="border-b border-[#d9cbbd]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 py-7 text-left text-lg font-semibold text-[#1c2a2e] transition-colors hover:text-[#a8735d] sm:text-xl"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    <span>{item.question}</span>
                    <motion.span
                      className="shrink-0 text-[#a8735d]"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      aria-hidden
                    >
                      {isOpen ? <ChevronDown className="size-5" /> : <Plus className="size-5" />}
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="max-w-2xl pb-7 pr-10 text-base leading-7 text-[#6c7a7d]">
                          {item.answer}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
