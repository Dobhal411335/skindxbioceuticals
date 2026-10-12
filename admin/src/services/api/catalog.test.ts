import { uploadCategoryBanner } from "@/services/api/catalog";
import { apiClient } from "@/services/api/axios";

jest.mock("@/services/api/axios", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("catalog media upload mapping", () => {
  it("prefers result.secureUrl and result.publicId", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        message: "ok",
        data: {
          media: { id: "m1", url: "http://res.cloudinary.com/demo/old.jpg" },
          result: {
            publicId: "categories/banner",
            secureUrl: "https://res.cloudinary.com/demo/secure.jpg",
          },
        },
      },
    });

    const uploaded = await uploadCategoryBanner("IN", new File(["x"], "x.jpg"));
    expect(uploaded).toEqual({
      url: "https://res.cloudinary.com/demo/secure.jpg",
      publicId: "categories/banner",
    });
  });
});
