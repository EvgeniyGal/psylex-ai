"use client";

import { useEffect } from "react";
import { syncParticipantLocale } from "@/app/(participant)/actions/locale";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";

export function PortalLocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    void syncParticipantLocale(locale);
  }, [locale]);

  return <LocaleSwitcher />;
}
