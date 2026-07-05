"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
