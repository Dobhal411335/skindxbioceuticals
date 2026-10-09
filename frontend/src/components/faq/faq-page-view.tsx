"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Facebook, Instagram, Mail, MessageSquare } from "lucide-react";

import { OffersBanner } from "@/components/shared/offers-banner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  faqCategories,
  faqIntro,
  faqTopics,
  type FaqTopic,
} from "@/data/faq";

export function FaqPageView() {
  const [topic, setTopic] = useState<FaqTopic>("all");

  const visibleCategories = useMemo(() => {
    if (topic === "all") return faqCategories;
    return faqCategories.filter((category) => category.topic === topic);
  }, [topic]);

  return (
    <>
      <div className="container-page section-space">
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">FAQs</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-wide uppercase sm:text-4xl">
          {faqIntro.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {faqIntro.body}{" "}
          <a
            href={`mailto:${faqIntro.email}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {faqIntro.email}
          </a>
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]">
          <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
            <div>
              <label
                htmlFor="faq-topic"
                className="mb-2 block text-sm font-medium"
              >
                Filter by topic:
              </label>
              <Select
                value={topic}
                onValueChange={(value) => setTopic(value as FaqTopic)}
              >
                <SelectTrigger id="faq-topic" className="w-full max-w-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {faqTopics.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border p-5">
              <h2 className="text-lg font-semibold">Need help?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Still stuck after reading the FAQs? Send a message or use the contact
                page — response hours are listed in the footer.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3">
                  <Link href="/contact">
                    <MessageSquare className="size-4" aria-hidden />
                    Message us
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3">
                  <a href={`mailto:${faqIntro.email}`}>
                    <Mail className="size-4" aria-hidden />
                    Contact us
                  </a>
                </Button>
              </div>
              <div className="mt-5 flex gap-3 text-muted-foreground">
                <span className="sr-only">Social links (placeholders)</span>
                <Facebook className="size-4" aria-hidden />
                <Instagram className="size-4" aria-hidden />
              </div>
            </div>
          </aside>

          <div className="space-y-10">
            {visibleCategories.map((category) => (
              <section key={category.id} aria-labelledby={`faq-${category.id}`}>
                <h2
                  id={`faq-${category.id}`}
                  className="border-b-2 border-primary pb-2 text-xl font-semibold"
                >
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="mt-2">
                  {category.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="border-border">
                      <AccordionTrigger className="py-4 text-base hover:no-underline">
                        <span>
                          <span className="mr-1 font-semibold text-primary">Q:</span>
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        <p className="leading-relaxed">{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}

            {visibleCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No questions in this topic yet.
              </p>
            ) : null}

            <div className="border-t border-border pt-10 text-center">
              <p className="text-sm text-muted-foreground">
                Unable to find satisfactory answers?
              </p>
              <Button
                asChild
                size="lg"
                className="mt-4 rounded-md bg-[#e07a5f] text-white hover:bg-[#d4694f]"
              >
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <OffersBanner />
    </>
  );
}
