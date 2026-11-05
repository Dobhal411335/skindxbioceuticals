import {
  filterSearchCatalogEntries,
  getCategories,
  getCategoryBySlugOrName,
  resolveSearchDestination,
  type SearchCatalogEntry,
} from "./catalog.service";

const catalogIndex: SearchCatalogEntry[] = [
  {
    id: "c1",
    kind: "category",
    name: "Creams",
    slug: "creams",
    mainSlug: "creams",
    mainName: "Creams",
    href: "/category/creams",
    imageUrl: null,
  },
  {
    id: "s1",
    kind: "subcategory",
    name: "Face Cream",
    slug: "face-cream",
    mainSlug: "creams",
    mainName: "Creams",
    href: "/category/creams/face-cream",
    imageUrl: null,
  },
];

describe("catalog.service", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("returns empty list when API URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    await expect(getCategories()).resolves.toEqual([]);
  });

  it("maps successful category list responses", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api/v1";
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "ok",
        data: [
          {
            id: "1",
            siteCode: "IN",
            name: "Serums",
            slug: "serums",
            order: 1,
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const result = await getCategories();
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("serums");
  });

  it("returns null for missing category detail", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api/v1";
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    await expect(getCategoryBySlugOrName("missing")).resolves.toBeNull();
  });

  it("filters matching categories and subcategories", () => {
    const matches = filterSearchCatalogEntries(catalogIndex, "face");
    expect(matches).toHaveLength(1);
    expect(matches[0]?.href).toBe("/category/creams/face-cream");
  });

  it("resolves Enter destination to subcategory when query matches", () => {
    expect(resolveSearchDestination("Face Cream", catalogIndex)).toBe(
      "/category/creams/face-cream",
    );
    expect(resolveSearchDestination("creams", catalogIndex)).toBe("/category/creams");
  });

  it("falls back to category index when no category matches", () => {
    expect(resolveSearchDestination("vitamin c serum", catalogIndex)).toBe(
      "/category",
    );
  });
});
