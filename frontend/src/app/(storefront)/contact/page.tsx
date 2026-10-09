import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { faqIntro } from "@/data/faq";

export const metadata: Metadata = {
  title: "Contact | SkinDx Bioceuticals",
  description: "Contact SkinDx Bioc India support.",
};

export default function ContactPage() {
  return (
    <div className="container-page section-space max-w-2xl">
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Contact</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">Contact support</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Static contact form UI. Messages are not sent until the enquiry API is
        connected. Email{" "}
        <a
          href={`mailto:${faqIntro.email}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {faqIntro.email}
        </a>
        .
      </p>
      <form className="mt-8 space-y-4" action="#" method="get">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            name="message"
            rows={5}
            placeholder="How can we help?"
          />
        </div>
        <Button type="button">Send message</Button>
      </form>
    </div>
  );
}
