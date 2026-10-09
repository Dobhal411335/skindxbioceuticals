import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { OffersBanner } from "@/components/shared/offers-banner";
import { Button } from "@/components/ui/button";
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  getRecentBlogPosts,
} from "@/data/blog";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: `${post.title} | SkinDx Bioceuticals`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = getRecentBlogPosts(3).filter((entry) => entry.slug !== post.slug);

  return (
    <>
      <article className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)]">
          <BlogSidebar />

          <div>
            <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{post.title}</span>
            </nav>

            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              {post.category}
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {post.date} · By {post.author} · {post.commentsLabel}
            </p>

            <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-surface">
              <Image
                src={post.image}
                alt={post.alt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 70vw"
              />
            </div>

            <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {post.content.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            {related.length > 0 ? (
              <div className="mt-12 border-t border-border pt-8">
                <h2 className="text-lg font-semibold">More to read</h2>
                <ul className="mt-4 space-y-3">
                  {related.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/blog/${entry.slug}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {entry.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-6">
                  <Link href="/blog">Back to blog</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      <OffersBanner />
    </>
  );
}
