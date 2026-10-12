import { isEmptyRichTextHtml, stripHtmlToText } from "@/lib/tiptap/extensions";

describe("tiptap html helpers", () => {
  it("strips tags for table previews", () => {
    expect(
      stripHtmlToText("<p><strong>Hello</strong> &amp; welcome</p><br/><h2>Title</h2>"),
    ).toBe("Hello & welcome Title");
  });

  it("treats empty paragraph markup as empty rich text", () => {
    expect(isEmptyRichTextHtml("")).toBe(true);
    expect(isEmptyRichTextHtml("<p></p>")).toBe(true);
    expect(isEmptyRichTextHtml("<p><br></p>")).toBe(true);
    expect(isEmptyRichTextHtml("<p>Body</p>")).toBe(false);
    expect(isEmptyRichTextHtml('<p><img src="https://example.com/a.png" /></p>')).toBe(
      false,
    );
  });
});
