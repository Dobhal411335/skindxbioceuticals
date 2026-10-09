import { BlogCard } from "@/components/landing/blog-card";
import { insightsIntro, posts } from "@/data/landing";

export function InsightsGrid() {
  return (
    <section className="container-page section-space" aria-labelledby="insights-heading">
      <div className="mb-8 max-w-2xl">
        <h2
          id="insights-heading"
          className="font-display text-3xl font-semibold tracking-tight text-secondary sm:text-4xl"
        >
          {insightsIntro.title}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {insightsIntro.subtitle}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} variant="insight" />
        ))}
      </div>
    </section>
  );
}
