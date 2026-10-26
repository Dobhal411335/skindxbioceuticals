import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FALLBACK_LANDING_FAQS } from "@/features/faq/faq.defaults";
import type { StorefrontFaqItem } from "@/types/faq";

type FaqSectionProps = {
  items?: StorefrontFaqItem[];
};

export function FaqSection({ items }: FaqSectionProps) {
  const faqs = items && items.length > 0 ? items : FALLBACK_LANDING_FAQS;

  return (
    <section className="w-full bg-[#f8f4ec] py-16 sm:py-20 lg:py-24" aria-labelledby="faq-heading">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.16em] text-[#a56b4e] uppercase">
            <span className="h-0.5 w-8 bg-[#b97858]" aria-hidden />
            Frequently asked questions
          </div>
          <h2
            id="faq-heading"
            className="mt-6 font-display text-4xl leading-[1.02] font-semibold tracking-tight text-[#17262d] sm:text-5xl lg:text-6xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-[#718087] sm:text-lg">
            Every engagement is different, but these questions help explain how we work.
          </p>
        </div>

        <div className="lg:pt-1">
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-[#e9d8bd] first:border-t"
              >
                <AccordionTrigger className="rounded-none cursor-pointer px-0 py-6 text-left text-lg font-semibold text-[#17262d] no-underline hover:no-underline focus-visible:ring-2 focus-visible:ring-primary sm:text-xl [&>svg]:hidden!">
                  {faq.question}
                  <span className="flex size-6 shrink-0 items-center justify-center text-2xl font-normal leading-none text-[#b97858]">
                    <span
                      className="transition-opacity duration-200 group-aria-expanded/accordion-trigger:hidden"
                      aria-hidden
                    >
                      +
                    </span>
                    <span
                      className="hidden transition-opacity duration-200 group-aria-expanded/accordion-trigger:inline"
                      aria-hidden
                    >
                      −
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-6 pt-0 text-base leading-relaxed text-[#718087]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
