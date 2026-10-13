import { BlogCard } from "@/components/landing/blog-card";
import { formatBlogDate, getLandingBlogs } from "@/features/blog/blog.service";
import type { LandingPost } from "@/data/landing";
import { insightsIntro } from "@/data/landing";
function toLandingPost(blog: {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  description?: string;
}): LandingPost {
  const excerpt =
    blog.description
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140) || "";

  return {
    id: blog.id,
    title: blog.title,
    excerpt,
    category: blog.category,
    date: formatBlogDate(blog.publishedAt),
    author: blog.createdBy || "SkinDx Editorial",
    image:
      blog.imageUrl || "https://placehold.co/800x600/png?text=SkinDx+Blog",
    alt: blog.title,
    href: `/blog/${blog.slug}`,
  };
}

/** Compact three-card blog strip from the skincare mockup. */
export async function BlogGrid() {
  const blogs = await getLandingBlogs(3);

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="container-page section-space" aria-labelledby="blog-grid-heading">
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
      <div className="grid gap-6 md:grid-cols-3">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} post={toLandingPost(blog)} variant="grid" />
        ))}
      </div>
    </section>
  );
}
