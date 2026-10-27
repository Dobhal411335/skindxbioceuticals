"use client";

import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { useTopAdvertisement } from "@/providers/top-advertisement-provider";

export function FeatureBenefitsBar() {
  const { benefits } = useTopAdvertisement();

  if (benefits.length === 0) {
    return null;
  }

  return (
    <section
      className="border-y my-10 border-black"
      aria-label="Shopping benefits"
    >
      <div className="container-page grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {benefits.map((item, index) => {
          const titleNode = item.href ? (
            <Link
              href={item.href}
              className="transition-colors hover:text-primary cursor-pointer hover:underline decoration-primary decoration-1 underline-offset-4"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          );

          return (
            <div
              key={`${item.title}-${index}`}
              className="relative flex items-center px-2 lg:px-6"
            >
              {index > 0 ? (
                <Separator
                  orientation="vertical"
                  className="absolute top-0 left-0 hidden h-full lg:block border-black border-r-2 border-l-0"
                />
              ) : null}
              <h3 className="text-lg font-semibold">{titleNode}</h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}
