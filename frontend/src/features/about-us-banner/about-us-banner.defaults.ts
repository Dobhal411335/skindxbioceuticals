import { about, blogIntro, posts, specials } from "@/data/landing";
import type { StorefrontAboutUsBanner } from "@/types/about-us-banner";

export const FALLBACK_ABOUT_US_BANNER: StorefrontAboutUsBanner = {
  promo: {
    label: specials.label,
    title: specials.title,
    subtitle: specials.subtitle,
    cta: { ...specials.cta },
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
