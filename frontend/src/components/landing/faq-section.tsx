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
    <section className="container-page section-space" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="font-display mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-8 max-w-2xl">
        <Accordion type="single" collapsible defaultValue={faqs[0]?.id} className="space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border rounded-lg bg-background transition-shadow hover:shadow-sm"
            >
              <AccordionTrigger className="text-left text-base px-5 py-4 font-medium hover:bg-muted/50 rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-5 pb-4 pt-2 rounded-b-lg">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
