"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminCopy } from "@/lib/admin-i18n";
import { copy, type Locale } from "@/lib/i18n";
import { detectLocale, LOCALE_CHANGE_EVENT, setStoredLocale } from "@/lib/locale";
import { portalCopy } from "@/lib/portal-i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  landing: (typeof copy)[Locale];
  admin: (typeof adminCopy)[Locale];
  portal: (typeof portalCopy)[Locale];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
    const onChange = () => setLocaleState(detectLocale());
    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  const setLocale = (next: Locale) => {
    setStoredLocale(next);
    setLocaleState(next);
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      landing: copy[locale],
      admin: adminCopy[locale],
      portal: portalCopy[locale],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

const fallback: LocaleContextValue = {
  locale: "en",
  setLocale: () => {},
  landing: copy.en,
  admin: adminCopy.en,
  portal: portalCopy.en,
};

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return ctx ?? fallback;
}
