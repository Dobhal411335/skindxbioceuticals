import { cache } from "react";

import {
  FALLBACK_BLOG_CATEGORIES,
  FALLBACK_BLOGS,
  getFallbackBlogBySlug,
  getFallbackRecentBlogs,
} from "@/features/blog/blog.defaults";
import type {
  StorefrontBlog,
  StorefrontBlogCard,
  StorefrontBlogDetail,
  StorefrontBlogListResult,
} from "@/types/blog";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiBlog = {
  id: string;
  slug: string;
  name: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  description?: string;
  blockquote?: string;
  createdAt?: string;
};

type ApiBlogCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
};

type ApiBlogDetail = ApiBlog & {
  related?: ApiBlogCard[];
};

type ApiBlogList = {
  blogs: ApiBlog[];
  categories: string[];
};

const STOREFRONT_SITE_CODE = "IN" as const;

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) {
    return "";
  }
  return value.replace(/\/$/, "");
}

function preferHttps(url: string): string {
  if (url.startsWith("http://res.cloudinary.com/")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

function mapBlog(row: ApiBlog): StorefrontBlog {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    title: row.title || row.name,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy || "",
    imageUrl: preferHttps(row.imageUrl || ""),
    description: row.description || "",
    blockquote: row.blockquote || "",
    createdAt: row.createdAt || row.publishedAt,
  };
}

function mapCard(row: ApiBlogCard): StorefrontBlogCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    title: row.title || row.name,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy || "",
    imageUrl: preferHttps(row.imageUrl || ""),
  };
}

export function formatBlogDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function fetchBlogList(options?: {
  category?: string;
  recent?: boolean;
  limit?: number;
}): Promise<StorefrontBlogListResult | null> {
  const base = apiBaseUrl();
  if (!base) {
    return null;
  }

  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.recent) params.set("recent", "true");
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";

  try {
    const response = await fetch(
      `${base}/sites/${STOREFRONT_SITE_CODE}/blogs${query}`,
      {
        next: { revalidate: 60, tags: ["blogs", "IN"] },
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiSuccess<ApiBlogList>;
    if (!payload?.success || !payload.data || !Array.isArray(payload.data.blogs)) {
      return null;
    }

    return {
      blogs: payload.data.blogs.map(mapBlog),
      categories: Array.isArray(payload.data.categories)
        ? payload.data.categories
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Blog index: active posts, optional category filter.
 * Falls back to static data only when the API is unavailable.
 */
export const getBlogs = cache(
  async (category?: string): Promise<StorefrontBlogListResult> => {
    const remote = await fetchBlogList({ category });
    if (!remote) {
      const blogs = category
        ? FALLBACK_BLOGS.filter(
            (post) => post.category.toLowerCase() === category.toLowerCase(),
          )
        : FALLBACK_BLOGS;
      return {
        blogs,
        categories: FALLBACK_BLOG_CATEGORIES,
      };
    }

    return {
      blogs: remote.blogs,
      categories:
        remote.categories.length > 0
          ? remote.categories
          : FALLBACK_BLOG_CATEGORIES,
    };
  },
);

/**
 * Landing / sidebar recent posts (max 4).
 */
export const getRecentBlogs = cache(
  async (limit = 4): Promise<StorefrontBlogCard[]> => {
    const remote = await fetchBlogList({ recent: true, limit });
    if (!remote) {
      return getFallbackRecentBlogs(limit);
    }
    return remote.blogs.slice(0, limit).map((blog) => ({
      id: blog.id,
      slug: blog.slug,
      name: blog.name,
      category: blog.category,
      title: blog.title,
      publishedAt: blog.publishedAt,
      createdBy: blog.createdBy,
      imageUrl: blog.imageUrl,
    }));
  },
);

/**
 * Landing blog grid (first N active posts).
 */
export const getLandingBlogs = cache(async (limit = 3): Promise<StorefrontBlog[]> => {
  const remote = await fetchBlogList({ limit });
  if (!remote) {
    return FALLBACK_BLOGS.slice(0, limit);
  }
  return remote.blogs.slice(0, limit);
});

/**
 * Article detail by slug + related same-category cards.
 * Uses static fallback only when the API is unavailable (not on 404).
 */
export const getBlogBySlug = cache(
  async (slug: string): Promise<StorefrontBlogDetail | null> => {
    const base = apiBaseUrl();
    if (!base) {
      return getFallbackBlogBySlug(slug);
    }

    try {
      const response = await fetch(
        `${base}/sites/${STOREFRONT_SITE_CODE}/blogs/${encodeURIComponent(slug)}`,
        {
          next: { revalidate: 60, tags: ["blogs", "IN", `blog:${slug}`] },
          headers: { Accept: "application/json" },
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return getFallbackBlogBySlug(slug);
      }

      const payload = (await response.json()) as ApiSuccess<ApiBlogDetail>;
      if (!payload?.success || !payload.data?.slug) {
        return getFallbackBlogBySlug(slug);
      }

      return {
        ...mapBlog(payload.data),
        related: Array.isArray(payload.data.related)
          ? payload.data.related.map(mapCard)
          : [],
      };
    } catch {
      return getFallbackBlogBySlug(slug);
    }
  },
);
