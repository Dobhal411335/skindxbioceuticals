import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/landing";

export function FaqSection() {
  return (
    <section className="container-page section-space" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="font-display mx-auto max-w-2xl text-center text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-8 max-w-2xl">
        <Accordion type="single" collapsible defaultValue={faqs[0]?.id}>
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
