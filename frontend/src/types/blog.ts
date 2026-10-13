export type StorefrontBlog = {
  id: string;
  slug: string;
  name: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
  description: string;
  blockquote: string;
  createdAt: string;
};

export type StorefrontBlogCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  title: string;
  publishedAt: string;
  createdBy: string;
  imageUrl: string;
};

export type StorefrontBlogDetail = StorefrontBlog & {
  related: StorefrontBlogCard[];
};

export type StorefrontBlogCategory = {
  name: string;
  count: number;
};

export type StorefrontBlogListResult = {
  blogs: StorefrontBlog[];
  /** Distinct categories with active post counts for the sidebar. */
  categories: StorefrontBlogCategory[];
};
