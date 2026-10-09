"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { aboutPage } from "@/data/about";

export function AboutFaq() {
  const { title, items } = aboutPage.faq;
  const midpoint = Math.ceil(items.length / 2);
  const left = items.slice(0, midpoint);
  const right = items.slice(midpoint);

  return (
    <section
      className="container-page section-space border-t border-border"
      aria-labelledby="about-faq-heading"
    >
      <h2
        id="about-faq-heading"
        className="font-display mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </h2>

      <div className="mt-10 grid gap-x-12 gap-y-2 lg:grid-cols-2">
        {[left, right].map((column, columnIndex) => (
          <Accordion
            key={columnIndex === 0 ? "faq-left" : "faq-right"}
            type="single"
            collapsible
            defaultValue={column[0]?.id}
            className="w-full"
          >
            {column.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </section>
  );
}
