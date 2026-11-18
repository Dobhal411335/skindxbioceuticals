/**
 * Allowlist sanitizer for TipTap HTML rendered via dangerouslySetInnerHTML.
 * Strips scripts, event handlers, and unsafe URLs while keeping editor markup.
 */

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "STRIKE",
  "CODE",
  "PRE",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "UL",
  "OL",
  "LI",
  "A",
  "IMG",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "HR",
  "SPAN",
  "DIV",
]);

/** Drop entirely (do not unwrap children). */
const VOID_REMOVE_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "BASE",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "SVG",
  "MATH",
]);

const GLOBAL_ALLOWED_ATTRS = new Set(["class", "style"]);

const TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel", "class", "style"]),
  IMG: new Set(["src", "alt", "width", "height", "class", "style"]),
  TD: new Set(["colspan", "rowspan", "class", "style"]),
  TH: new Set(["colspan", "rowspan", "class", "style"]),
};

function isSafeUrl(value: string, kind: "href" | "src"): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;
  if (kind === "href" && /^(mailto:|tel:)/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  // Cloudinary / uploaded images may be protocol-relative.
  if (kind === "src" && trimmed.startsWith("//")) return true;
  return false;
}

function sanitizeElement(el: Element): void {
  const tag = el.tagName.toUpperCase();

  if (VOID_REMOVE_TAGS.has(tag)) {
    el.remove();
    return;
  }

  const children = Array.from(el.children);
  for (const child of children) {
    sanitizeElement(child);
  }

  if (!ALLOWED_TAGS.has(tag)) {
    el.replaceWith(...Array.from(el.childNodes));
    return;
  }

  const allowed = TAG_ALLOWED_ATTRS[tag] ?? GLOBAL_ALLOWED_ATTRS;
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on") || name === "srcdoc") {
      el.removeAttribute(attr.name);
      continue;
    }
    if (!allowed.has(name) && !GLOBAL_ALLOWED_ATTRS.has(name)) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === "href" || name === "src") {
      if (!isSafeUrl(attr.value, name)) {
        el.removeAttribute(attr.name);
      }
    }
    if (name === "style" && /expression|url\s*\(\s*['"]?\s*javascript:/i.test(attr.value)) {
      el.removeAttribute(attr.name);
    }
  }

  if (tag === "A") {
    const href = el.getAttribute("href");
    if (!href) {
      el.removeAttribute("href");
    } else {
      el.setAttribute("rel", "noopener noreferrer");
      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("target", "_blank");
      }
    }
  }
}

/** Conservative string fallback when DOMParser is unavailable. */
function stripDangerousHtmlFallback(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");
}

export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") {
    return stripDangerousHtmlFallback(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="sanitize-root">${html}</div>`, "text/html");
  const root = doc.getElementById("sanitize-root");
  if (!root) return stripDangerousHtmlFallback(html);

  sanitizeElement(root);
  return root.innerHTML;
}
