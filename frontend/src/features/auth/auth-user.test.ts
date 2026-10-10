import {
  getUserDisplayName,
  getUserInitial,
  isValidImageUrl,
} from "@/features/auth/auth-user";

describe("auth-user helpers", () => {
  it("builds display name from first/last or falls back to email", () => {
    expect(
      getUserDisplayName({ firstName: "Ada", lastName: "Lovelace", email: "a@x.com" }),
    ).toBe("Ada Lovelace");
    expect(getUserDisplayName({ firstName: null, lastName: null, email: "a@x.com" })).toBe(
      "a@x.com",
    );
  });

  it("uses uppercase name or email initial with ? fallback", () => {
    expect(getUserInitial({ firstName: "ada", lastName: null, email: "a@x.com" })).toBe("A");
    expect(getUserInitial({ firstName: null, lastName: null, email: "zeta@x.com" })).toBe("Z");
    expect(getUserInitial({ firstName: null, lastName: null, email: "" })).toBe("?");
  });

  it("accepts only absolute http(s) image URLs", () => {
    expect(isValidImageUrl("https://lh3.googleusercontent.com/a/abc")).toBe(true);
    expect(isValidImageUrl("not-a-url")).toBe(false);
    expect(isValidImageUrl(null)).toBe(false);
  });
});
