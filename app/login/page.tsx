"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const schema = z.object({
  login: z.string().regex(/^psylex_[0-9a-fA-F-]{36}$/),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form
        className="w-full space-y-4 rounded-2xl border border-white/10 bg-card p-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <div>
          <label className="mb-1 block text-sm">Login</label>
          <input
            className="w-full rounded-md border border-white/20 bg-bg px-3 py-2"
            {...form.register("login")}
          />
          <p className="mt-1 text-xs text-red-300">{form.formState.errors.login?.message}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input
            type="password"
            className="w-full rounded-md border border-white/20 bg-bg px-3 py-2"
            {...form.register("password")}
          />
          <p className="mt-1 text-xs text-red-300">{form.formState.errors.password?.message}</p>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
    </main>
  );
}
