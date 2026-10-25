import { about, blogIntro, posts } from "@/data/landing";
import type { StorefrontAboutUsBanner } from "@/types/about-us-banner";

export const FALLBACK_ABOUT_US_BANNER: StorefrontAboutUsBanner = {
  promo: {
    label: "A different kind of consultancy",
    title: "Insight that moves your business forward.",
    description:
      "Elvaris combines board-level perspective, sector expertise and hands-on execution to help leaders solve what matters most — without adding unnecessary complexity.",
    subtitle:
      "Our senior teams work alongside yours from the first question to the final outcome. We challenge assumptions, build alignment and leave your organization stronger than we found it.",
    cta: { label: "Learn more", href: "/about" },
    cards: [
      {
        id: "fallback-insight-1",
        title: "Senior expertise, always",
        body: "Your core team stays involved from diagnosis through delivery.",
      },
      {
        id: "fallback-insight-2",
        title: "Evidence over opinion",
        body: "Every recommendation is grounded in commercial reality and data.",
      },
      {
        id: "fallback-insight-3",
        title: "Built around outcomes",
        body: "Clear priorities, accountable execution and measurable impact.",
      },
      {
        id: "fallback-insight-4",
        title: "Capability that remains",
        body: "We transfer knowledge so progress continues after the project ends.",
      },
    ],
  },
  aboutCards: [
    {
      id: "fallback-about",
      label: about.label,
      title: about.title,
      body: about.body,
      cta: { ...about.cta },
      image: { ...about.image },
    },
  ],
  highlightItems: posts.map((post) => ({
    id: post.id,
    title: post.title,
    image: post.image,
    alt: post.alt,
    href: post.href,
    buttonLabel: "Read more",
  })),
  textSlides: [
    {
      id: "fallback-text",
      title: blogIntro.title,
      body: blogIntro.body,
    },
  ],
  servicesHeading: "Caring for your child, every step of the way",
  servicesViewAll: { label: "View all services", href: "/services" },
  services: [
    {
      id: "fallback-service",
      buttonLabel: "Our services",
      heading: "Personalized care for every family",
      description: "Thoughtful, expert-led care designed around your needs.",
      image: { ...about.image },
      highlights: ["Excellent laboratory", "World class infrastructure", "Health checkups"],
      doctor: {
        image: { ...about.image },
        name: "SkinDx Care Team",
        designation: "Specialist care",
        cta: { label: "Book an appointment", href: "/appointments" },
      },
    },
  ],
};
