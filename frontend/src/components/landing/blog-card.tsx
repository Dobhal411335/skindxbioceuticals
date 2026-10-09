import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingPost } from "@/data/landing";

type BlogCardProps = {
  post: LandingPost;
  variant?: "carousel" | "grid" | "insight";
};

export function BlogCard({ post, variant = "carousel" }: BlogCardProps) {
  return (
    <Card className="h-full overflow-hidden border-border shadow-none">
      <Link href={post.href} className="group flex h-full flex-col focus-visible:outline-none">
        <div className="relative aspect-[4/3] bg-surface">
          <Image
            src={post.image}
            alt={post.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {variant === "insight" ? (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              {post.category}
            </Badge>
          ) : null}
          {variant === "grid" ? (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-foreground text-background"
            >
              {post.category}
            </Badge>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          {variant !== "insight" ? (
            <p className="text-xs text-muted-foreground">
              {post.date} · By {post.author}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              by {post.author} | {post.date}
            </p>
          )}
          <h3 className="font-display text-lg leading-snug font-semibold group-hover:text-primary">
            {post.title}
          </h3>
          {variant === "grid" ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          ) : null}
          {variant === "carousel" || variant === "grid" ? (
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium underline-offset-4 group-hover:underline">
              Read more
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}
