import { resolvePromoMediaUpload } from "@/services/api/promo-banner";

describe("resolvePromoMediaUpload", () => {
  it("prefers result.secureUrl and result.publicId", () => {
    expect(
      resolvePromoMediaUpload({
        media: { url: "https://cdn.example.com/media.jpg", publicId: "media/id" },
        result: {
          secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/promo.jpg",
          publicId: "promo/tile",
          url: "http://res.cloudinary.com/demo/image/upload/v1/promo.jpg",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/promo.jpg",
      publicId: "promo/tile",
    });
  });

  it("falls back to media.url and upgrades http Cloudinary URLs", () => {
    expect(
      resolvePromoMediaUpload({
        media: {
          url: "http://res.cloudinary.com/demo/image/upload/v1/fallback.jpg",
          publicId: "promo/fallback",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/fallback.jpg",
      publicId: "promo/fallback",
    });
  });
});
