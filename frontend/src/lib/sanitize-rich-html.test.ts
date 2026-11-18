import { sanitizeRichHtml } from "./sanitize-rich-html";

describe("sanitizeRichHtml", () => {
  it("keeps TipTap-like markup", () => {
    const input = '<p>Hello <strong>world</strong></p><ul><li>One</li></ul>';
    expect(sanitizeRichHtml(input)).toContain("<strong>world</strong>");
    expect(sanitizeRichHtml(input)).toContain("<li>One</li>");
  });

  it("strips script tags and event handlers", () => {
    const input =
      '<p onclick="alert(1)">Safe</p><script>alert(2)</script><img src="https://cdn.example/a.png" onerror="alert(3)" />';
    const out = sanitizeRichHtml(input);
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).toContain("Safe");
    expect(out).toContain('src="https://cdn.example/a.png"');
  });

  it("removes javascript: URLs", () => {
    const out = sanitizeRichHtml(
      '<a href="javascript:alert(1)">Click</a><a href="/products/x">Ok</a>',
    );
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain('href="/products/x"');
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeRichHtml("")).toBe("");
    expect(sanitizeRichHtml(null)).toBe("");
    expect(sanitizeRichHtml(undefined)).toBe("");
  });
});
