/**
 * Collapse PDF extraction artifacts where letters are separated by spaces,
 * e.g. "К о д е к с" → "Кодекс".
 */
export function normalizeExtractedText(text: string): string {
  return text.replace(/((?:\p{L} )+\p{L})/gu, (match) => {
    const parts = match.split(" ");
    if (parts.length >= 3 && parts.every((part) => part.length === 1)) {
      return parts.join("");
    }
    return match;
  });
}
