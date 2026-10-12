import { getCategories, getCategoryBySlugOrName } from "./catalog.service";

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
            bannerUrl: "https://cdn.example.com/b.jpg",
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
});
