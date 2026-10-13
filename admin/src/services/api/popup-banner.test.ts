import { resolvePopupMediaUpload } from "@/services/api/popup-banner";

describe("resolvePopupMediaUpload", () => {
  it("prefers result.secureUrl and result.publicId", () => {
    expect(
      resolvePopupMediaUpload({
        media: { url: "https://cdn.example.com/media.jpg", publicId: "media/id" },
        result: {
          secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/popup.jpg",
          publicId: "popup/main",
          url: "http://res.cloudinary.com/demo/image/upload/v1/popup.jpg",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/popup.jpg",
      publicId: "popup/main",
    });
  });

  it("falls back to media.url and upgrades http Cloudinary URLs", () => {
    expect(
      resolvePopupMediaUpload({
        media: {
          url: "http://res.cloudinary.com/demo/image/upload/v1/fallback.jpg",
          publicId: "popup/fallback",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/fallback.jpg",
      publicId: "popup/fallback",
    });
  });
});
