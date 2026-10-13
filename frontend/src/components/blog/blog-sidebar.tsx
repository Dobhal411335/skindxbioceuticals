"use client";

import Link from "next/link";

import { ShareButton } from "@/components/shared/share-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatBlogDate } from "@/features/blog/blog.service";
import { cn } from "@/lib/utils";
import type { ShareContentInput } from "@/lib/share-text";
import type { StorefrontBlogCategory } from "@/types/blog";

type BlogSidebarProps = {
  categories: StorefrontBlogCategory[];
  recent: Array<{
    id: string;
    slug: string;
    title: string;
    publishedAt: string;
  }>;
  activeCategory?: string;
  /** When set (blog detail), enables Web Share / copy with title + SEO text. */
  share?: ShareContentInput;
};

export function BlogSidebar({
  categories,
  recent,
  activeCategory,
  share,
}: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      <Accordion
        type="multiple"
        defaultValue={["categories"]}
        className="w-full"
      >
        <AccordionItem value="categories" className="border-border">
          <AccordionTrigger className="py-3 text-base font-semibold text-secondary hover:no-underline">
            Categories
          </AccordionTrigger>
          <AccordionContent className="pb-4 [&_a]:no-underline">
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/blog"
                  className={cn(
                    "transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !activeCategory && "font-medium text-foreground",
                  )}
                >
                  All
                </Link>
              </li>
              {categories.length === 0 ? (
                <li>No categories yet.</li>
              ) : (
                categories.map((category) => {
                  const isActive =
                    activeCategory?.toLowerCase() ===
                    category.name.toLowerCase();
                  return (
                    <li key={category.name}>
                      <Link
                        href={`/blog?category=${encodeURIComponent(category.name)}`}
                        className={cn(
                          "transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive && "font-medium text-foreground",
                        )}
                      >
                        {category.name} ({category.count})
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="recent" className="border-border">
          <AccordionTrigger className="py-3 text-base font-semibold text-secondary hover:no-underline">
            Recent Posts
          </AccordionTrigger>
          <AccordionContent className="pb-4 [&_a]:no-underline">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent articles.</p>
            ) : (
              <ul className="space-y-4">
                {recent.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBlogDate(post.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {share ? (
        <ShareButton
          share={share}
          label={`Share ${share.title}`}
          variant="labeled"
        />
      ) : null}
    </aside>
  );
}
