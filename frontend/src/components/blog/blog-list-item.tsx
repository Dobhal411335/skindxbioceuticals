import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/data/blog";
import { cn } from "@/lib/utils";

type BlogListItemProps = {
  post: BlogPost;
  reversed?: boolean;
};

export function BlogListItem({ post, reversed = false }: BlogListItemProps) {
  return (
    <article
      className={cn(
        "grid items-center gap-6 border-b border-border py-10 md:grid-cols-2 md:gap-10",
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-surface",
          reversed && "md:order-2",
        )}
      >
        <Image
          src={post.image}
          alt={post.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className={cn(reversed && "md:order-1")}>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">
          {post.date} · {post.author} · {post.commentsLabel}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/blog/${post.slug}`}>View details</Link>
        </Button>
      </div>
    </article>
  );
}
