import { resolveHeroMediaUpload } from "@/services/api/hero-banner";

describe("resolveHeroMediaUpload", () => {
  it("prefers result.secureUrl and result.publicId", () => {
    expect(
      resolveHeroMediaUpload({
        media: { url: "http://res.cloudinary.com/demo/media.jpg", publicId: "media" },
        result: {
          secureUrl: "https://res.cloudinary.com/demo/secure.jpg",
          publicId: "hero/secure",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/secure.jpg",
      publicId: "hero/secure",
    });
  });

  it("upgrades media.url http Cloudinary links when result is missing", () => {
    expect(
      resolveHeroMediaUpload({
        media: {
          url: "http://res.cloudinary.com/demo/legacy.jpg",
          publicId: "hero/legacy",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/legacy.jpg",
      publicId: "hero/legacy",
    });
  });
});
