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

const VISIBLE_COLUMNS_MD = 5;
const TALL_RATIO = 1.05;
const AUTOPLAY_MS = 5000;
/** Horizontal gutter between stacked top/bottom media — match column gap. */
const STACK_GAP_CLASS = "gap-3 md:gap-4";
const COLUMN_GAP_CLASS = "pl-3 md:pl-4";
const CONTENT_OFFSET_CLASS = "-ml-3 md:-ml-4";

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
}: {
  column: GalleryColumn;
  columnIndex: number;
}) {
  if (column.type === "tall") {
    const item = column.items[0]!;
    return (
      <div className="flex h-full min-h-0 flex-col">
        <GalleryMedia
          item={item}
          alt={item.title || item.caption || `Gallery media ${columnIndex + 1}`}
          className="h-full min-h-[22rem] w-full md:min-h-[26rem]"
          sizes="(max-width: 768px) 50vw, 20vw"
          priority={columnIndex < 2}
        />
      </div>
    );
  }

  if (column.type === "stack") {
    return (
      <div
        className={cn(
          "flex h-full min-h-[22rem] flex-col md:min-h-[26rem]",
          STACK_GAP_CLASS,
        )}
      >
        {column.items.map((item, index) => (
          <GalleryMedia
            key={item.id}
            item={item}
            alt={
              item.title ||
              item.caption ||
              `Gallery media ${columnIndex + 1}-${index + 1}`
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
        alt={item.title || item.caption || `Gallery media ${columnIndex + 1}`}
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

  const columns = useMemo(
    () => packGalleryColumns(measuredItems),
    [measuredItems],
  );

  const canBrowse = columns.length > 1;

  useEffect(() => {
    if (!api || !isPlaying || !canBrowse) return undefined;

    const timer = window.setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [api, isPlaying, canBrowse]);

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
            {Array.from({ length: VISIBLE_COLUMNS_MD }).map((_, index) => (
              <div
                key={index}
                className="min-h-[22rem] animate-pulse rounded-xl bg-surface md:min-h-[26rem]"
              />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              loop: canBrowse,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className={CONTENT_OFFSET_CLASS}>
              {columns.map((column, index) => (
                <CarouselItem
                  key={`col-${index}-${column.items[0]?.id ?? index}`}
                  className={cn(
                    "basis-1/2 sm:basis-1/3 md:basis-1/5",
                    COLUMN_GAP_CLASS,
                  )}
                >
                  <GalleryColumnView column={column} columnIndex={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {canBrowse ? (
              <>
                <CarouselPrevious className="left-1 size-10 border-border bg-background text-foreground shadow-md hover:bg-surface md:-left-4" />
                <CarouselNext className="right-1 size-10 border-border bg-background text-foreground shadow-md hover:bg-surface md:-right-4" />
              </>
            ) : null}
          </Carousel>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {canBrowse ? (
          <>
            <Button
              type="button"
              size="sm"
              variant={isPlaying ? "default" : "outline"}
              className="rounded-full gap-1.5 px-4 shadow-sm"
              aria-pressed={isPlaying}
              onClick={() => setIsPlaying(true)}
            >
              <Play className="size-3.5" />
              Play
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isPlaying ? "default" : "outline"}
              className="rounded-full gap-1.5 px-4 shadow-sm"
              aria-pressed={!isPlaying}
              onClick={() => setIsPlaying(false)}
            >
              <Pause className="size-3.5" />
              Pause
            </Button>
          </>
        ) : null}
        <FullscreenGallery items={items} />
      </div>
    </section>
  );
}
