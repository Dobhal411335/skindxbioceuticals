import { BlogCard } from "@/components/landing/blog-card";
import { posts } from "@/data/landing";

/** Compact three-card blog strip from the skincare mockup. */
export function BlogGrid() {
  return (
    <section className="container-page section-space" aria-labelledby="blog-grid-heading">
      <h2 id="blog-grid-heading" className="sr-only">
        Latest articles
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <BlogCard key={post.id} post={post} variant="grid" />
        ))}
      </div>
    </section>
  );
}
