"use client";

import { BlogCard } from "@/components/landing/blog-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { blogIntro, posts } from "@/data/landing";

export function BlogCarousel() {
  return (
    <section className="container-page section-space" aria-labelledby="blog-rail-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
        <div className="max-w-md lg:order-2">
          <h2
            id="blog-rail-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {blogIntro.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {blogIntro.body}
          </p>
        </div>

        <div className="relative lg:order-1">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {posts.map((post) => (
                <CarouselItem
                  key={post.id}
                  className="basis-[85%] pl-3 sm:basis-1/2 lg:basis-1/2 xl:basis-1/3"
                >
                  <BlogCard post={post} variant="carousel" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 hidden sm:flex" />
            <CarouselNext className="-right-3 hidden sm:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
