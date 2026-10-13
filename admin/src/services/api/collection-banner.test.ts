import { resolveCollectionMediaUpload } from "@/services/api/collection-banner";

describe("resolveCollectionMediaUpload", () => {
  it("prefers result.secureUrl and result.publicId", () => {
    expect(
      resolveCollectionMediaUpload({
        media: { url: "https://cdn.example.com/media.jpg", publicId: "media/id" },
        result: {
          secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/collection.jpg",
          publicId: "collection/slide",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/collection.jpg",
      publicId: "collection/slide",
    });
  });
});
