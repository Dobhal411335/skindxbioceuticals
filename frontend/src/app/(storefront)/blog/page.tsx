import Link from "next/link";
import type { Metadata } from "next";

import { BlogListItem } from "@/components/blog/blog-list-item";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { OffersBanner } from "@/components/shared/offers-banner";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog | SkinDx Bioceuticals",
  description: "Educational notes and brand updates from SkinDx Bioc.",
};

type BlogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;
  const posts = category
    ? blogPosts.filter(
        (post) => post.category.toLowerCase() === category.toLowerCase(),
      )
    : blogPosts;

  return (
    <>
      <div className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)]">
          <div>
            <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Blog</span>
            </nav>
            <h1 className="text-3xl font-semibold tracking-wide uppercase">Blog</h1>
            <div className="mt-8">
              <BlogSidebar />
            </div>
          </div>

          <div>
            {posts.length === 0 ? (
              <p className="py-10 text-sm text-muted-foreground">
                No articles in this category yet.
              </p>
            ) : (
              posts.map((post, index) => (
                <BlogListItem
                  key={post.id}
                  post={post}
                  reversed={index % 2 === 1}
                />
              ))
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 py-8">
              <Button type="button" variant="outline" disabled>
                Prev post
              </Button>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold">1</span>
                <span className="text-muted-foreground">2</span>
                <span className="text-muted-foreground">Next</span>
              </div>
              <Button type="button" variant="outline" disabled>
                Next post
              </Button>
            </div>
          </div>
        </div>
      </div>
      <OffersBanner />
    </>
  );
}
