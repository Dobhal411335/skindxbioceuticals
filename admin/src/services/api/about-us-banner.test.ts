import { resolveAboutUsMediaUpload } from "@/services/api/about-us-banner";

describe("resolveAboutUsMediaUpload", () => {
  it("reads nested media/result shape from the upload API", () => {
    expect(
      resolveAboutUsMediaUpload({
        media: {
          id: "media-1",
          url: "https://res.cloudinary.com/demo/image/upload/v1/about.jpg",
          publicId: "skindx/IN/about/about",
        },
        result: {
          publicId: "skindx/IN/about/about",
          secureUrl:
            "https://res.cloudinary.com/demo/image/upload/v1/about.jpg",
          url: "http://res.cloudinary.com/demo/image/upload/v1/about.jpg",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/about.jpg",
      publicId: "skindx/IN/about/about",
    });
  });

  it("upgrades Cloudinary http URLs to https", () => {
    expect(
      resolveAboutUsMediaUpload({
        media: {
          url: "http://res.cloudinary.com/demo/image/upload/v1/about.jpg",
        },
        result: {
          publicId: "about/card",
          url: "http://res.cloudinary.com/demo/image/upload/v1/about.jpg",
        },
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/about.jpg",
      publicId: "about/card",
    });
  });

  it("does not treat a missing nested result as a successful URL", () => {
    expect(resolveAboutUsMediaUpload({})).toEqual({ url: "", publicId: "" });
  });
});
