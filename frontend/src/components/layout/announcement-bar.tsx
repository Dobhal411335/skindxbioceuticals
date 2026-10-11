"use client";

import Link from "next/link";

import { useTopAdvertisement } from "@/providers/top-advertisement-provider";
import type { StorefrontAnnouncementItem } from "@/types/top-advertisement";

function AnnouncementText({ item }: { item: StorefrontAnnouncementItem }) {
  if (item.href) {
    return (
      <Link
        href={item.href}
        className="underline-offset-2 transition-opacity hover:underline hover:opacity-90"
      >
        {item.text}
      </Link>
    );
  }
  return <span>{item.text}</span>;
}

export function AnnouncementBar() {
  const { announcements } = useTopAdvertisement();
  const active = announcements.filter((item) => item.text.trim());

  if (active.length === 0) {
    return null;
  }

  if (active.length === 1) {
    const item = active[0]!;
    return (
      <div className="bg-secondary text-secondary-foreground">
        <p className="container-page py-2 text-center text-xs tracking-wide sm:text-sm">
          <AnnouncementText item={item} />
        </p>
      </div>
    );
  }

  // Duplicate the sequence so CSS translate can loop seamlessly.
  const track = [...active, ...active];

  return (
    <div className="bg-secondary text-secondary-foreground">
      <div
        className="group relative overflow-hidden py-2 text-xs tracking-wide sm:text-sm"
        aria-label="Announcements"
      >
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap px-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-6 motion-reduce:whitespace-normal">
          {track.map((item, index) => (
            <span key={`${item.text}-${index}`} className="inline-flex shrink-0">
              <AnnouncementText item={item} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
