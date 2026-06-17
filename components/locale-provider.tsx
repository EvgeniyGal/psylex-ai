"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminCopy } from "@/lib/admin-i18n";
import type { Locale } from "@/lib/i18n";
import { detectLocale, LOCALE_CHANGE_EVENT, setStoredLocale } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  admin: (typeof adminCopy)[Locale];
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
    () => ({ locale, setLocale, admin: adminCopy[locale] }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
