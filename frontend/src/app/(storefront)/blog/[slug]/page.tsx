import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { OffersBanner } from "@/components/shared/offers-banner";
import { Button } from "@/components/ui/button";
import {
  formatBlogDate,
  getBlogBySlug,
  getBlogs,
  getRecentBlogs,
} from "@/features/blog/blog.service";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return { title: "Article not found" };
  const description =
    post.description
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160) || post.title;
  return {
    title: `${post.title} | SkinDx Bioceuticals`,
    description,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, list, recent] = await Promise.all([
    getBlogBySlug(slug),
    getBlogs(),
    getRecentBlogs(4),
  ]);

  if (!post) {
    notFound();
  }

  const imageSrc =
    post.imageUrl || "https://placehold.co/1200x675/png?text=SkinDx+Blog";

  return (
    <>
      <article className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)]">
          <BlogSidebar categories={list.categories} recent={recent} />

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
              {formatBlogDate(post.publishedAt)}
              {post.createdBy ? ` · By ${post.createdBy}` : ""}
            </p>

            <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-surface">
              <Image
                src={imageSrc}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 70vw"
              />
            </div>

            {post.blockquote ? (
              <blockquote className="mt-8 border-l-4 border-primary/40 pl-5 text-base leading-relaxed text-foreground/90 italic sm:text-lg">
                {post.blockquote}
              </blockquote>
            ) : null}

            {post.description ? (
              <div
                className="rich-html mt-8 max-w-none text-sm leading-relaxed text-muted-foreground sm:text-base"
                dangerouslySetInnerHTML={{ __html: post.description }}
              />
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">
                This article does not have content yet.
              </p>
            )}

            {post.related.length > 0 ? (
              <div className="mt-12 border-t border-border pt-8">
                <h2 className="text-lg font-semibold">Related articles</h2>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                  {post.related.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/blog/${entry.slug}`}
                        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                          <Image
                            src={
                              entry.imageUrl ||
                              "https://placehold.co/800x600/png?text=SkinDx+Blog"
                            }
                            alt={entry.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 30vw"
                          />
                        </div>
                        <p className="mt-3 text-sm font-semibold group-hover:text-primary">
                          {entry.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatBlogDate(entry.publishedAt)}
                          {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              null
            )}
          </div>
        </div>
      </article>
      <OffersBanner />
    </>
  );
}
