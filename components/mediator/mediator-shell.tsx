"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale } from "@/components/locale-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

const navItems = [{ href: "/mediator/rooms", key: "navRooms" as const, icon: "gavel" }];

export function MediatorSidebar() {
  const pathname = usePathname();
  const { admin } = useLocale();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/10 bg-surface-container py-stack-md shadow-sm">
      <div className="mb-10 px-6">
        <div className="flex items-center gap-3">
          <Image alt="PsyLex" className="h-8 w-auto" height={32} src="/logo.webp" unoptimized width={32} />
          <span className="font-display text-headline-md font-bold text-primary">PsyLex</span>
        </div>
        <p className="mt-1 font-display text-label-md uppercase tracking-widest text-on-surface-variant">
          {admin.mediatorConsole}
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-all",
                active
                  ? "border-l-4 border-tertiary bg-tertiary/10 text-tertiary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
              )}
              href={item.href}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-body-md">{admin[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 px-4">
        <div className="flex justify-center rounded-lg border border-outline-variant/20 py-3">
          <LocaleSwitcher />
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-3 font-bold text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          <span className="material-symbols-outlined">logout</span>
          {admin.logout}
        </button>
      </div>
    </aside>
  );
}
