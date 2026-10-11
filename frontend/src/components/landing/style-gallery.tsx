"use client";

import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

function GalleryMedia({
  item,
  alt,
  priority = false,
  className,
}: {
  item: GalleryItem;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  if (item.mediaType === "video") {
    return (
      <video
        src={item.mediaUrl}
        className={cn("h-auto w-full rounded-2xl object-cover", className)}
        muted
        playsInline
        autoPlay
        loop
        preload="metadata"
        aria-label={alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- masonry needs natural media height
    <img
      src={item.mediaUrl}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-auto w-full rounded-2xl object-cover", className)}
    />
  );
}

function FullscreenGallery({ items }: { items: GalleryItem[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full gap-2 bg-secondary px-4 text-secondary-foreground shadow-sm"
        >
          <Camera className="size-4" />
          View gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[min(96vw,72rem)] max-w-6xl overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Lookbook</DialogTitle>
        </DialogHeader>
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3">
          {items.map((item, index) => (
            <div key={item.id} className="mb-4 break-inside-avoid">
              {item.mediaType === "video" ? (
                <video
                  src={item.mediaUrl}
                  className="h-auto w-full rounded-2xl object-cover"
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  aria-label={`Gallery detail ${index + 1}`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- fullscreen masonry uses natural height
                <img
                  src={item.mediaUrl}
                  alt={`Gallery detail ${index + 1}`}
                  className="h-auto w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StyleGallery({ items }: { items: GalleryItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className="container-page section-space"
      aria-labelledby="gallery-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="gallery-heading"
          className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          #Lookbook Gallery
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Real routines, textures, and moments from SkinDx Bioc.
        </p>
      </div>

      <div
        className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-5"
        role="list"
      >
        {items.map((item, index) => {
          const delayMs = Math.min(index * 45, 360);
          const alt = `Gallery media ${index + 1}`;

          return (
            <div
              key={item.id}
              role="listitem"
              className="group mb-4 break-inside-avoid motion-safe:animate-[fade-up_0.55s_ease-out_both] motion-reduce:animate-none"
              style={{ animationDelay: `${delayMs}ms` }}
            >
              <div className="overflow-hidden rounded-2xl bg-surface transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.015]">
                <GalleryMedia
                  item={item}
                  alt={alt}
                  priority={index < 4}
                  className="rounded-2xl"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <FullscreenGallery items={items} />
      </div>
    </section>
  );
}
