"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteHeader } from "@/components/site-header";
import { useLocale } from "@/components/locale-provider";
import { credentialsSchema, type CredentialsInput } from "@/lib/login-schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { landing: t } = useLocale();
  const magicLinkErrors = useMemo(
    () => ({
      missing_magic_token: t.magicLinkMissingToken,
      invalid_magic_link: t.magicLinkInvalid,
    }),
    [t],
  );
  const magicError = magicLinkErrors[searchParams.get("error") as keyof typeof magicLinkErrors];
  const [error, setError] = useState<string | null>(magicError ?? null);
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = async (values: CredentialsInput) => {
    setError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/admin/sessions",
    });

    if (result?.ok) {
      const redirectResponse = await fetch("/api/auth/redirect");
      const { path } = (await redirectResponse.json()) as { path: string };
      router.push(path);
      return;
    }
    setError(t.invalidCredentials);
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-surface-container-low">
      <SiteHeader
        trailing={
          <>
            <Link
              className="hidden items-center gap-1.5 text-label-md text-primary-fixed-dim transition-opacity hover:opacity-80 sm:flex"
              href="/"
            >
              <span className="material-symbols-outlined text-base">home</span>
              {t.backToStart}
            </Link>
            <LocaleSwitcher />
          </>
        }
      />

      <div className="relative flex flex-grow items-center justify-center px-6">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-tertiary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <h1 className="font-display text-headline-lg text-on-surface">{t.signInTitle}</h1>
            <p className="text-center text-body-sm text-on-surface-variant">{t.signInSubtitle}</p>
          </div>

          <form
            className="glass-panel space-y-5 rounded-2xl p-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div>
              <label className="mb-2 block font-display text-label-md text-on-surface-variant">
                {t.loginLabel}
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-tertiary"
                placeholder="psylex_..."
                {...form.register("login")}
              />
              {form.formState.errors.login ? (
                <p className="mt-1 text-xs text-error">{t.invalidLoginFormat}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block font-display text-label-md text-on-surface-variant">
                {t.passwordLabel}
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-on-surface focus:border-tertiary focus:ring-tertiary"
                type="password"
                {...form.register("password")}
              />
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button
              className="btn-primary w-full px-6 py-3 text-body-md transition-opacity hover:opacity-90"
              type="submit"
            >
              {t.signInButton}
            </button>
          </form>

          <p className="mt-6 text-center text-body-sm text-on-surface-variant">
            <Link className="text-tertiary hover:underline" href="/">
              {t.backToLanding}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
