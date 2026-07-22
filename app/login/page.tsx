import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";
import { LoginForm } from "./login-form";
import LoginLoading from "./loading";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description:
    "Sign in to PsyLex to continue mediation, manage rooms, or access your dispute workspace.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
