import Image from "next/image";

import { aboutPage } from "@/data/about";

export function AboutStory() {
  const { title, body, images } = aboutPage.story;

  return (
    <section
      className="container-page section-space"
      aria-labelledby="about-story-heading"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative overflow-hidden bg-surface ${
                index === 0
                  ? "aspect-[3/4] translate-y-4 sm:translate-y-6"
                  : "aspect-[3/4] -translate-y-2 sm:-translate-y-4"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                sizes="(max-width: 1024px) 45vw, 22vw"
              />
            </div>
          ))}
        </div>

        <div className="max-w-xl lg:py-4">
          <h2
            id="about-story-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}
