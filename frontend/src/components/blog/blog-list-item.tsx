import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatBlogDate } from "@/features/blog/blog.service";
import type { StorefrontBlog } from "@/types/blog";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type BlogListItemProps = {
  post: StorefrontBlog;
  reversed?: boolean;
};

function excerptFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function BlogListItem({ post, reversed = false }: BlogListItemProps) {
  const excerpt = excerptFromHtml(post.description);
  const imageSrc =
    post.imageUrl || "https://placehold.co/800x600/png?text=SkinDx+Blog";

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
          src={imageSrc}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className={cn(reversed && "md:order-1")}>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          {post.category}
        </p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">
          {formatBlogDate(post.publishedAt)}
          {post.createdBy ? ` · ${post.createdBy}` : ""}
        </p>
        {excerpt ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {excerpt}
            {excerpt.length >= 180 ? "…" : ""}
          </p>
        ) : null}
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/blog/${post.slug}`}>Read More <ArrowRight className="size-4" aria-hidden /></Link>
        </Button>
      </div>
    </article>
  );
}
