/** True when TipTap / HTML content has visible text (ignores empty tags). */
export function hasVisibleHtmlContent(value: string | null | undefined): boolean {
  if (!value) return false;
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}
