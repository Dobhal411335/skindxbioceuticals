import Image from "next/image";

import type { StorefrontBlogGalleryImage } from "@/types/blog";

type BlogGalleryProps = {
  images: StorefrontBlogGalleryImage[];
  title: string;
};

export function BlogGallery({ images, title }: BlogGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <section className="mt-10" aria-label="Article gallery">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {images.map((image, index) => (
          <div
            key={`${image.publicId || image.url}-${index}`}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f3ebe1]"
          >
            <Image
              src={image.url}
              alt={`${title} gallery image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
