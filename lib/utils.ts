import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-stable string compare for SSR/client-consistent table sorting. */
const stableCollator = new Intl.Collator("en", { sensitivity: "base" });

export function compareStringsStable(left: string, right: string) {
  return stableCollator.compare(left, right);
}
