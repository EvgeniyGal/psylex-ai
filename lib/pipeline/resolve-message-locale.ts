import type { Locale } from "@/lib/i18n";
import type { LocalizedContent } from "@/lib/pipeline/types";

type MessageWithLocale = {
  content: string;
  contentByLocale: LocalizedContent | null;
};

export function getMessageContent(message: MessageWithLocale, viewerLocale: Locale): string {
  if (message.contentByLocale) {
    const localized = message.contentByLocale[viewerLocale];
    if (localized) return localized;
    return message.contentByLocale.en ?? message.contentByLocale.uk ?? message.content;
  }
  return message.content;
}

export function roomLocalesDiffer(locales: Locale[]): boolean {
  const unique = new Set(locales);
  return unique.size > 1;
}
