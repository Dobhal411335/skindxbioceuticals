import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
    image: blog.imageUrl || "https://placehold.co/800x600/png?text=SkinDx+Blog",
    alt: blog.title,
    href: `/blog/${blog.slug}`,
  };
}

function EditorialBlogCard({ post, featured = false }: { post: LandingPost; featured?: boolean }) {
  return (
    <Link
      href={post.href}
      className={`group relative isolate flex min-h-[16rem] overflow-hidden rounded-[20px] bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${featured ? "lg:row-span-2 lg:min-h-[34rem]" : ""}`}
    >
      <Image
        src={post.image}
        alt={post.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 50vw"}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#07151d]/95 via-[#07151d]/35 to-transparent"
      />
      <div className="relative z-10 mt-auto flex max-w-2xl flex-col items-start gap-2 p-5 text-white sm:p-7">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[0.12em] uppercase backdrop-blur-sm">
          {post.category}
        </span>
        <h3
          className={`font-display font-semibold leading-tight tracking-tight ${featured ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"}`}
        >
          {post.title}
        </h3>
        {featured ? (
          <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {post.excerpt}
          </p>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white/85">
          {post.date} · By {post.author}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export async function BlogGrid() {
  const blogs = (await getLandingBlogs(3)).slice(0, 3);

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="container-page section-space" aria-labelledby="blog-grid-heading">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2
            id="blog-grid-heading"
            className="font-display text-3xl font-semibold tracking-tight text-secondary sm:text-4xl"
          >
            {insightsIntro.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {insightsIntro.subtitle}
          </p>
        </div>
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all blogs
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-2">
        {blogs.map((blog, index) => (
          <EditorialBlogCard key={blog.id} post={toLandingPost(blog)} featured={index === 0} />
        ))}
      </div>
    </section>
  );
}
