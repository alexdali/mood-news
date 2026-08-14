import sanitizeHtml from "sanitize-html";

export function cleanSourceText(value: string | null | undefined): string {
  if (!value) return "";
  const text = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const clipped = value.slice(0, maxChars - 1);
  const boundary = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf(" "));
  return `${clipped.slice(0, boundary > maxChars * 0.6 ? boundary + 1 : clipped.length).trim()}…`;
}
