import { Suspense } from "react";
import { LoginForm } from "./login-form";
import LoginLoading from "./loading";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
