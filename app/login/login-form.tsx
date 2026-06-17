"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { credentialsSchema, type CredentialsInput } from "@/lib/login-schema";

const magicLinkErrors: Record<string, string> = {
  missing_magic_token: "Magic link is missing a token.",
  invalid_magic_link: "This magic link is invalid or has expired.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicError = magicLinkErrors[searchParams.get("error") ?? ""];
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
      router.push("/admin/sessions");
      return;
    }
    setError("Invalid credentials");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6">
      <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-tertiary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image alt="PsyLex" className="h-10 w-auto" height={40} src="/stitch/logo.png" width={140} />
          <h1 className="font-display text-headline-lg text-on-surface">Admin Login</h1>
          <p className="text-center text-body-sm text-on-surface-variant">
            Sign in to access the PsyLex mediation portal
          </p>
        </div>

        <form
          className="glass-panel space-y-5 rounded-2xl p-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div>
            <label className="mb-2 block font-display text-label-md text-on-surface-variant">Login</label>
            <input
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-mono text-sm text-on-surface focus:border-tertiary focus:ring-tertiary"
              placeholder="psylex_..."
              {...form.register("login")}
            />
            {form.formState.errors.login ? (
              <p className="mt-1 text-xs text-error">Invalid login format</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block font-display text-label-md text-on-surface-variant">Password</label>
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
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-body-sm text-on-surface-variant">
          <Link className="text-tertiary hover:underline" href="/">
            ← Back to landing page
          </Link>
        </p>
      </div>
    </main>
  );
}
