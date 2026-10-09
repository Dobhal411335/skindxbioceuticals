import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

import { blogCategories, getRecentBlogPosts } from "@/data/blog";

export function BlogSidebar() {
  const recent = getRecentBlogPosts(3);

  return (
    <aside className="space-y-10">
      <div>
        <h2 className="text-sm font-semibold tracking-wide uppercase">Categories</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {blogCategories.map((category) => (
            <li key={category}>
              <Link
                href={`/blog?category=${encodeURIComponent(category)}`}
                className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Recent articles
        </h2>
        <ul className="mt-4 space-y-4">
          {recent.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {post.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{post.date}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 text-muted-foreground">
        <span className="sr-only">Social links (placeholders)</span>
        <Facebook className="size-4" aria-hidden />
        <Instagram className="size-4" aria-hidden />
      </div>
    </aside>
  );
}
