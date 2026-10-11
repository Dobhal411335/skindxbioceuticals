"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Camera, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/gallery";

const COLUMNS_PER_SLIDE = 5;
const TALL_RATIO = 1.05;
const AUTOPLAY_MS = 5000;

type MeasuredItem = GalleryItem & {
  width: number;
  height: number;
  isTall: boolean;
};

type GalleryColumn =
  | { type: "tall"; items: MeasuredItem[] }
  | { type: "stack"; items: MeasuredItem[] }
  | { type: "single"; items: MeasuredItem[] };

function loadMediaMeta(item: GalleryItem): Promise<MeasuredItem> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !item.mediaUrl) {
      resolve({ ...item, width: 1, height: 1, isTall: false });
      return;
    }

    if (item.mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        const width = video.videoWidth || 1;
        const height = video.videoHeight || 1;
        resolve({
          ...item,
          width,
          height,
          isTall: height / width >= TALL_RATIO,
        });
      };
      video.onerror = () => {
        resolve({ ...item, width: 1, height: 1.2, isTall: true });
      };
      video.src = item.mediaUrl;
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      resolve({
        ...item,
        width,
        height,
        isTall: height / width >= TALL_RATIO,
      });
    };
    img.onerror = () => {
      resolve({ ...item, width: 1, height: 1, isTall: false });
    };
    img.src = item.mediaUrl;
  });
}

/** Pack tall media as full-height columns; wide media as stacked pairs (2-row masonry). */
function packGalleryColumns(items: MeasuredItem[] = []): GalleryColumn[] {
  const tall = items.filter((item) => item.isTall);
  const wide = items.filter((item) => !item.isTall);
  const columns: GalleryColumn[] = [];
  let ti = 0;
  let wi = 0;

  while (ti < tall.length || wi < wide.length) {
    const canStackWide = wi + 1 < wide.length;
    const preferStack =
      canStackWide && (ti >= tall.length || columns.length % 2 === 1);

    if (preferStack) {
      columns.push({
        type: "stack",
        items: [wide[wi]!, wide[wi + 1]!],
      });
      wi += 2;
      continue;
    }

    if (ti < tall.length) {
      columns.push({ type: "tall", items: [tall[ti]!] });
      ti += 1;
      continue;
    }

    if (canStackWide) {
      columns.push({
        type: "stack",
        items: [wide[wi]!, wide[wi + 1]!],
      });
      wi += 2;
      continue;
    }

    if (wi < wide.length) {
      columns.push({ type: "single", items: [wide[wi]!] });
      wi += 1;
    }
  }

  return columns;
}

function chunkColumns(columns: GalleryColumn[], size: number) {
  const chunks: GalleryColumn[][] = [];
  for (let i = 0; i < columns.length; i += size) {
    chunks.push(columns.slice(i, i + size));
  }
  return chunks;
}

function GalleryMedia({
  item,
  alt,
  className,
  sizes,
  priority = false,
}: {
  item: GalleryItem;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface",
        className,
      )}
    >
      {item.mediaType === "video" ? (
        <video
          src={item.mediaUrl}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          aria-label={alt}
        />
      ) : (
        <Image
          src={item.mediaUrl}
          alt={alt}
          fill
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          className="object-cover"
        />
      )}
    </div>
  );
}

function GalleryColumnView({
  column,
  columnIndex,
  slideIndex,
}: {
  column: GalleryColumn;
  columnIndex: number;
  slideIndex: number;
}) {
  const baseIndex = slideIndex * COLUMNS_PER_SLIDE + columnIndex;

  if (column.type === "tall") {
    const item = column.items[0]!;
    return (
      <div className="flex h-full min-h-0 flex-col">
        <GalleryMedia
          item={item}
          alt={item.title || item.caption || `Gallery media ${baseIndex + 1}`}
          className="h-full min-h-[22rem] w-full md:min-h-[26rem]"
          sizes="(max-width: 768px) 50vw, 20vw"
          priority={slideIndex === 0 && columnIndex < 2}
        />
      </div>
    );
  }

  if (column.type === "stack") {
    return (
      <div className="flex h-full min-h-[22rem] flex-col gap-2.5 md:min-h-[26rem] md:gap-3">
        {column.items.map((item, index) => (
          <GalleryMedia
            key={item.id}
            item={item}
            alt={
              item.title ||
              item.caption ||
              `Gallery media ${baseIndex + 1}-${index + 1}`
            }
            className="min-h-0 w-full flex-1"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ))}
      </div>
    );
  }

  const item = column.items[0]!;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <GalleryMedia
        item={item}
        alt={item.title || item.caption || `Gallery media ${baseIndex + 1}`}
        className="h-full min-h-[11rem] w-full md:min-h-[13rem]"
        sizes="(max-width: 768px) 50vw, 20vw"
      />
    </div>
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
          className="gap-2 bg-secondary text-secondary-foreground shadow-sm"
        >
          <Camera className="size-4" />
          View gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[min(96vw,72rem)] max-w-6xl overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Lookbook</DialogTitle>
        </DialogHeader>
        <div className="columns-1 gap-3 sm:columns-2 md:columns-3 md:gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="mb-3 break-inside-avoid md:mb-4">
              {item.mediaType === "video" ? (
                <video
                  src={item.mediaUrl}
                  className="h-auto w-full rounded-xl object-cover"
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  aria-label={item.title || item.caption || `Gallery detail ${index + 1}`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- fullscreen masonry uses natural height
                <img
                  src={item.mediaUrl}
                  alt={item.title || item.caption || `Gallery detail ${index + 1}`}
                  className="h-auto w-full rounded-xl object-cover"
                  loading="lazy"
                />
              )}
              {item.title || item.caption ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.title || item.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StyleGallery({ items }: { items: GalleryItem[] }) {
  const [measuredItems, setMeasuredItems] = useState<MeasuredItem[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!items.length) {
      setMeasuredItems([]);
      setIsMeasuring(false);
      return undefined;
    }

    setIsMeasuring(true);
    void Promise.all(items.map(loadMediaMeta)).then((results) => {
      if (!cancelled) {
        setMeasuredItems(results);
        setIsMeasuring(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const slides = useMemo(() => {
    const columns = packGalleryColumns(measuredItems);
    return chunkColumns(columns, COLUMNS_PER_SLIDE);
  }, [measuredItems]);

  useEffect(() => {
    if (!api || !isPlaying || slides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [api, isPlaying, slides.length]);

  if (!items.length) {
    return null;
  }

  const showSkeleton = isMeasuring && measuredItems.length === 0;

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

      <div className="relative mt-10">
        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3">
            {Array.from({ length: COLUMNS_PER_SLIDE }).map((_, index) => (
              <div
                key={index}
                className="min-h-[22rem] animate-pulse rounded-xl bg-surface md:min-h-[26rem]"
              />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: slides.length > 1 }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {slides.map((slideColumns, index) => (
                <CarouselItem key={index} className="basis-full pl-0">
                  <div className="relative">
                    <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3">
                      {slideColumns.map((column, columnIndex) => (
                        <GalleryColumnView
                          key={`col-${index}-${columnIndex}`}
                          column={column}
                          columnIndex={columnIndex}
                          slideIndex={index}
                        />
                      ))}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {slides.length > 1 ? (
              <>
                <CarouselPrevious className="left-1 size-10 border-border bg-background text-foreground shadow-none hover:bg-surface md:-left-4" />
                <CarouselNext className="right-1 size-10 border-border bg-background text-foreground shadow-none hover:bg-surface md:-right-4" />
              </>
            ) : null}
          </Carousel>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {slides.length > 1 ? (
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
            <Button
              type="button"
              size="sm"
              variant={isPlaying ? "default" : "ghost"}
              className="rounded-full gap-1.5 px-4"
              aria-pressed={isPlaying}
              onClick={() => setIsPlaying(true)}
            >
              <Play className="size-3.5" />
              Play
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isPlaying ? "default" : "ghost"}
              className="rounded-full gap-1.5 px-4"
              aria-pressed={!isPlaying}
              onClick={() => setIsPlaying(false)}
            >
              <Pause className="size-3.5" />
              Pause
            </Button>
          </div>
        ) : null}
        <FullscreenGallery items={items} />
      </div>
    </section>
  );
}
