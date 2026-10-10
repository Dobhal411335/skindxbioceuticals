import { getSafeRedirectPath } from "@/features/auth/auth.validation";

describe("getSafeRedirectPath", () => {
  it("returns the fallback when redirect is missing", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath(undefined, "/account")).toBe("/account");
  });

  it("allows same-origin relative paths", () => {
    expect(getSafeRedirectPath("/shop")).toBe("/shop");
    expect(getSafeRedirectPath("/account/orders?tab=open")).toBe(
      "/account/orders?tab=open",
    );
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/");
    expect(getSafeRedirectPath("//evil.example")).toBe("/");
    expect(getSafeRedirectPath("http://localhost:3000/shop")).toBe("/");
    expect(getSafeRedirectPath("\\evil")).toBe("/");
  });
});
