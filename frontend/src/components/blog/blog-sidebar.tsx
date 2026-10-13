import Link from "next/link";
import { Globe, Share2 } from "lucide-react";

import { formatBlogDate } from "@/features/blog/blog.service";

type BlogSidebarProps = {
  categories: string[];
  recent: Array<{
    id: string;
    slug: string;
    title: string;
    publishedAt: string;
  }>;
  activeCategory?: string;
};

export function BlogSidebar({
  categories,
  recent,
  activeCategory,
}: BlogSidebarProps) {
  return (
    <aside className="space-y-10">
      <div>
        <h2 className="text-sm font-semibold tracking-wide uppercase">Categories</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <Link
              href="/blog"
              className={
                !activeCategory
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              }
            >
              All
            </Link>
          </li>
          {categories.length === 0 ? (
            <li className="text-muted-foreground">No categories yet.</li>
          ) : (
            categories.map((category) => {
              const isActive =
                activeCategory?.toLowerCase() === category.toLowerCase();
              return (
                <li key={category}>
                  <Link
                    href={`/blog?category=${encodeURIComponent(category)}`}
                    className={
                      isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    }
                  >
                    {category}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Recent articles
        </h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No recent articles.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {recent.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </div>

      <div className="flex gap-3 text-muted-foreground">
        <span className="sr-only">Social links (placeholders)</span>
        <Share2 className="size-4" aria-hidden />
        <Globe className="size-4" aria-hidden />
      </div>
    </aside>
  );
}
