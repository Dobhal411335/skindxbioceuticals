import { publicSiteHeaders } from "@/lib/public-site-fetch";
import { storefrontSiteCode } from "@/config/site";
import { cache } from "react";

import {
  getCategories,
  getCategoryBySlugOrName,
} from "@/features/catalog/catalog.service";
import { getCompanyBasicInfo } from "@/features/company-basic-info/company-basic-info.service";

export type SitemapLink = {
  label: string;
  href: string;
};

export type SitemapGroup = {
  title: string;
  links: SitemapLink[];
};

export type SitemapEntry = {
  url: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
};

export type SitemapCategory = {
  name: string;
  slug: string;
  subcategories: Array<{ name: string; slug: string }>;
};

export type SitemapSources = {
  categories: SitemapCategory[];
  products: Array<{ name: string; slug: string }>;
  blogs: Array<{ title: string; slug: string }>;
  pages: Array<{ title: string; slug: string }>;
};

const PRODUCT_PAGE_SIZE = 48;
const MAX_PRODUCT_PAGES = 40;

/** Slugs already served by a dedicated storefront route, plus private areas. */
const RESERVED_PAGE_SLUGS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "become-vendor",
  "blog",
  "careers",
  "cart",
  "category",
  "checkout",
  "contact",
  "contact-with-us",
  "doctors",
  "faq",
  "products",
  "sitemap",
  "testimonials",
  "unsubscribe",
  "vendor",
  "wishlist",
]);

const ABOUT_HREF = "https://skindxbioceuticals.com/about-skindx-bioceuticals";

const COMPANY_LINKS: SitemapLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: ABOUT_HREF },
  { label: "Doctors", href: "/doctors" },
  { label: "Careers", href: "/careers" },
  { label: "Become a vendor", href: "/become-vendor" },
];

const SUPPORT_LINKS: SitemapLink[] = [
  { label: "Contact", href: "/contact-with-us" },
  { label: "FAQ", href: "/faq" },
];

type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { totalPages?: number };
};

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) return "";
  return value.replace(/\/$/, "");
}

function byLabel(left: SitemapLink, right: SitemapLink): number {
  return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
}

function pathFor(slug: string): string {
  return `/${encodeURIComponent(slug.trim())}`;
}

function pageLabel(title: string, titleLine: string, slug: string): string {
  const raw = (title || titleLine || slug).trim();
  const beforePipe = raw.split("|")[0]?.trim() || raw;
  return beforePipe.length > 90 ? `${beforePipe.slice(0, 87).trim()}…` : beforePipe;
}

export function storefrontOrigin(domainName: string | null | undefined): string {
  const value = String(domainName || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/\/$/, "");
  return `https://${value.replace(/\/$/, "")}`;
}

export function buildSitemapGroups(sources: SitemapSources): SitemapGroup[] {
  const seen = new Set<string>();
  const take = (links: SitemapLink[]): SitemapLink[] => {
    const next: SitemapLink[] = [];
    for (const link of links) {
      const href = link.href.trim();
      const label = link.label.trim();
      if (!href || !label || seen.has(href)) continue;
      seen.add(href);
      next.push({ label, href });
    }
    return next;
  };

  const shop: SitemapLink[] = [{ label: "All categories", href: "/category" }];
  const categories = [...sources.categories].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
  for (const category of categories) {
    if (!category.name.trim() || !category.slug.trim()) continue;
    shop.push({
      label: category.name.trim(),
      href: `/category/${encodeURIComponent(category.slug.trim())}`,
    });
    const subs = [...category.subcategories].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
    for (const sub of subs) {
      if (!sub.name.trim() || !sub.slug.trim()) continue;
      shop.push({
        label: `${category.name.trim()} / ${sub.name.trim()}`,
        href: `/category/${encodeURIComponent(category.slug.trim())}/${encodeURIComponent(sub.slug.trim())}`,
      });
    }
  }

  const products = sources.products
    .filter((item) => item.name.trim() && item.slug.trim())
    .map((item) => ({
      label: item.name.trim(),
      href: `/products/${encodeURIComponent(item.slug.trim())}`,
    }))
    .sort(byLabel);

  const posts = sources.blogs
    .filter((item) => item.title.trim() && item.slug.trim())
    .map((item) => ({
      label: item.title.trim(),
      href: `/blog/${encodeURIComponent(item.slug.trim())}`,
    }))
    .sort(byLabel);

  const pages = sources.pages
    .filter((item) => {
      const slug = item.slug.trim().toLowerCase();
      return item.title.trim() && slug && !RESERVED_PAGE_SLUGS.has(slug);
    })
    .map((item) => ({
      label: item.title.trim(),
      href: pathFor(item.slug),
    }))
    .sort(byLabel);

  const groups: SitemapGroup[] = [
    { title: "Company", links: take(COMPANY_LINKS) },
    { title: "Categories", links: take(shop) },
  ];

  const productLinks = take(products);
  if (productLinks.length > 0) {
    groups.push({ title: "Products", links: productLinks });
  }

  groups.push({
    title: "Blogs",
    links: take([
      { label: "Blog", href: "/blog" },
      ...posts,
      { label: "Testimonials", href: "/testimonials" },
    ]),
  });

  const pageLinks = take(pages);
  if (pageLinks.length > 0) {
    groups.push({ title: "Pages", links: pageLinks });
  }

  groups.push({ title: "Support", links: take(SUPPORT_LINKS) });
  return groups;
}

export function toSitemapEntries(origin: string, groups: SitemapGroup[]): SitemapEntry[] {
  const base = origin.replace(/\/$/, "");
  const hrefs = new Set<string>();
  for (const group of groups) {
    for (const link of group.links) hrefs.add(link.href);
  }
  hrefs.add("/sitemap");

  return [...hrefs].map((href) => ({
    url: /^https?:\/\//i.test(href) ? href : `${base}${href === "/" ? "" : href}`,
    changeFrequency:
      href === "/" ||
      href === "/blog" ||
      href === "/category" ||
      href.startsWith("/products/") ||
      href.startsWith("/blog/") ||
      href.startsWith("/category/")
        ? "weekly"
        : "monthly",
    priority:
      href === "/"
        ? 1
        : href === "/category" || href === "/blog"
          ? 0.8
          : href.startsWith("/products/") || href.startsWith("/category/")
            ? 0.7
            : href.startsWith("/blog/")
              ? 0.6
              : 0.5,
  }));
}

async function fetchJson<T>(path: string): Promise<ApiSuccess<T> | null> {
  const base = apiBaseUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path}`, {
      next: { revalidate: 3600, tags: ["sitemap", storefrontSiteCode] },
      headers: publicSiteHeaders(),
    });
    if (!response.ok) return null;
    return (await response.json()) as ApiSuccess<T>;
  } catch {
    return null;
  }
}

async function loadCategories(): Promise<SitemapCategory[]> {
  const categories = await getCategories();
  const details = await Promise.all(
    categories.map((category) => getCategoryBySlugOrName(category.slug)),
  );
  return categories.map((category, index) => ({
    name: category.name,
    slug: category.slug,
    subcategories: (details[index]?.subcategories ?? [])
      .filter((item) => item.name && item.slug)
      .map((item) => ({ name: item.name, slug: item.slug })),
  }));
}

async function loadProducts(): Promise<Array<{ name: string; slug: string }>> {
  const items: Array<{ name: string; slug: string }> = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PRODUCT_PAGES) {
    const payload = await fetchJson<Array<{ name?: string; slug?: string }>>(
      `/sites/${storefrontSiteCode}/products?limit=${PRODUCT_PAGE_SIZE}&page=${page}`,
    );
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    for (const row of rows) {
      if (row?.name && row.slug) items.push({ name: row.name, slug: row.slug });
    }
    const reported = Number(payload?.meta?.totalPages ?? 0);
    totalPages = Number.isFinite(reported) && reported > 0 ? reported : page;
    if (rows.length < PRODUCT_PAGE_SIZE) break;
    page += 1;
  }

  return items;
}

async function loadBlogs(): Promise<Array<{ title: string; slug: string }>> {
  const payload = await fetchJson<{ blogs?: Array<{ title?: string; name?: string; slug?: string }> }>(
    `/sites/${storefrontSiteCode}/blogs`,
  );
  const rows = Array.isArray(payload?.data?.blogs) ? payload.data.blogs : [];
  return rows
    .filter((row) => row?.slug && (row.title || row.name))
    .map((row) => ({
      title: (row.title || row.name || "").trim(),
      slug: row.slug!.trim(),
    }));
}

async function loadPages(): Promise<Array<{ title: string; slug: string }>> {
  const payload = await fetchJson<Array<{ title?: string; titleLine?: string; slug?: string }>>(
    `/sites/${storefrontSiteCode}/webpages`,
  );
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .filter((row) => row?.slug)
    .map((row) => ({
      title: pageLabel(row.title || "", row.titleLine || "", row.slug || ""),
      slug: row.slug!.trim(),
    }));
}

export const getSitemapGroups = cache(async (): Promise<SitemapGroup[]> => {
  const [categories, products, blogs, pages] = await Promise.all([
    loadCategories().catch(() => []),
    loadProducts().catch(() => []),
    loadBlogs().catch(() => []),
    loadPages().catch(() => []),
  ]);

  return buildSitemapGroups({ categories, products, blogs, pages });
});

export const getStorefrontOrigin = cache(async (): Promise<string> => {
  const company = await getCompanyBasicInfo();
  return storefrontOrigin(company.companyDomainName);
});
