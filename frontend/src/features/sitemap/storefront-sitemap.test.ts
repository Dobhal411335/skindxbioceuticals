import {
  buildSitemapGroups,
  storefrontOrigin,
  toSitemapEntries,
} from "@/features/sitemap/storefront-sitemap";

describe("storefront sitemap", () => {
  it("normalizes the public site origin", () => {
    expect(storefrontOrigin("")).toBe("https://skindxbioceuticals.in");
    expect(storefrontOrigin("skindxbioceuticals.in")).toBe(
      "https://skindxbioceuticals.in",
    );
    expect(storefrontOrigin("https://skindxbioceuticals.in/")).toBe(
      "https://skindxbioceuticals.in",
    );
  });

  it("lists public pages and skips reserved content slugs", () => {
    const groups = buildSitemapGroups({
      categories: [
        {
          name: "Face Care",
          slug: "face-care",
          subcategories: [{ name: "Cleansers", slug: "cleansers" }],
        },
      ],
      products: [{ name: "Daily Serum", slug: "daily-serum" }],
      blogs: [{ title: "Reading a label", slug: "reading-a-label" }],
      pages: [
        { title: "Privacy Policy", slug: "privacy-policy" },
        { title: "Careers duplicate", slug: "careers" },
        { title: "Account", slug: "account" },
      ],
    });

    const hrefs = groups.flatMap((group) => group.links.map((link) => link.href));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/",
        "/about",
        "/careers",
        "/category",
        "/category/face-care",
        "/category/face-care/cleansers",
        "/products/daily-serum",
        "/blog",
        "/blog/reading-a-label",
        "/testimonials",
        "/privacy-policy",
        "/contact",
        "/faq",
      ]),
    );
    expect(hrefs).not.toContain("/careers-duplicate");
    expect(hrefs).not.toContain("/account");
    expect(hrefs.filter((href) => href === "/careers")).toHaveLength(1);
  });

  it("builds absolute search-engine urls from the same links", () => {
    const groups = buildSitemapGroups({
      categories: [],
      products: [],
      blogs: [],
      pages: [],
    });
    const entries = toSitemapEntries("https://skindxbioceuticals.in", groups);
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://skindxbioceuticals.in");
    expect(urls).toContain("https://skindxbioceuticals.in/sitemap");
    expect(urls).not.toContain("https://skindxbioceuticals.in/account");
    expect(entries.find((entry) => entry.url.endsWith(".in"))?.priority).toBe(1);
  });
});
