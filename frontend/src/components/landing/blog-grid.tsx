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
  badgeText?: string;
  stat1Number?: string;
  stat1Name?: string;
  stat1Text?: string;
  stat2Number?: string;
  stat2Name?: string;
  stat2Text?: string;
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
      .slice(0, 220) || "";

  return {
    id: blog.id,
    title: blog.title,
    excerpt,
    category: blog.category,
    badgeText: blog.badgeText?.trim() || undefined,
    stats: [
      { number: blog.stat1Number?.trim() || "", name: blog.stat1Name?.trim() || "", text: blog.stat1Text?.trim() || undefined },
      { number: blog.stat2Number?.trim() || "", name: blog.stat2Name?.trim() || "", text: blog.stat2Text?.trim() || undefined },
    ].filter((stat) => stat.number || stat.name || stat.text),
    date: formatBlogDate(blog.publishedAt),
    author: blog.createdBy || "SkinDx Editorial",
    image: blog.imageUrl || "https://placehold.co/800x600/png?text=SkinDx+Blog",
    alt: blog.title,
    href: `/blog/${blog.slug}`,
  };
}

/** Large editorial card for the left column. */
function FeaturedBlogCard({ post }: { post: LandingPost }) {
  const miniHeading = post.badgeText || post.category || "Our Story";

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={post.href}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-muted rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:aspect-[16/11] lg:min-h-[14rem] lg:flex-1"
      >
        <Image
          src={post.image}
          alt={post.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 rounded-2xl"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:gap-4 sm:p-6 lg:p-7">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-white/55 sm:w-14" aria-hidden />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#f0d8c9] uppercase">
              {miniHeading}
            </p>
            <span className="h-px w-6 bg-white/55 sm:w-8" aria-hidden />
          </div>

          <h3 className="max-w-xl text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-white sm:text-[2.35rem]">
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className="max-w-xl line-clamp-2 text-sm leading-relaxed text-white/85 sm:text-[0.95rem]">
              {post.excerpt}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold tracking-[0.12em] text-white/90 uppercase">
              {post.date} · By {post.author}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-[#14272e] uppercase shadow-sm transition-colors group-hover:bg-white">
              Read More
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Horizontal list card for the right column — title + short description. */
function SideBlogCard({ post }: { post: LandingPost }) {
  return (
    <Link
      href={post.href}
      className="group flex min-h-[10.75rem] gap-4 overflow-hidden rounded-2xl border border-[#e5e2dc] bg-[#fbfaf8] p-3.5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_10px_28px_rgb(20_35_45_/_0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-5 sm:p-4"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-0.5">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold tracking-tight text-primary transition-colors group-hover:text-primary/85 sm:text-[1.05rem]">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
          Read More
          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </div>
      <div className="relative aspect-[4/3] w-[7.5rem] shrink-0 overflow-hidden rounded-xl bg-muted sm:w-[9.5rem]">
        <Image
          src={post.image}
          alt={post.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="160px"
        />
      </div>
    </Link>
  );
}

export async function BlogGrid() {
  const blogs = (await getLandingBlogs(4)).slice(0, 4);

  if (blogs.length === 0) {
    return null;
  }

  const posts = blogs.map(toLandingPost);
  const [featured, ...sidePosts] = posts;

  return (
    <section className="container-page section-space" aria-labelledby="blog-grid-heading">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#ef6a24] uppercase">
            Our Blog
          </p>
          <h2
            id="blog-grid-heading"
            className="mt-5 max-w-2xl text-4xl leading-[0.98] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
          >
            {insightsIntro.title}
          </h2>
          <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#ef6a24] to-[#f0d8c9]" />
        </div>
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-primary hover:text-white"
        >
          View all blogs
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.95fr] lg:items-stretch lg:gap-8">
        <div className="min-h-[22rem] lg:min-h-[34rem]">
          <FeaturedBlogCard post={featured!} />
        </div>

        {sidePosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sidePosts.slice(0, 3).map((post) => (
              <SideBlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
