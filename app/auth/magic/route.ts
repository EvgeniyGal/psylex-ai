import { redirect } from "next/navigation";
import { consumeMagicToken } from "@/lib/magic-link";
import { getPostLoginRedirect } from "@/lib/onboarding";
import { establishSession } from "@/lib/session";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    redirect("/login?error=missing_magic_token");
  }

  const user = await consumeMagicToken(token);

  if (!user) {
    redirect("/login?error=invalid_magic_link");
  }

  await establishSession({
    id: user.id,
    login: user.login,
    role: user.role,
  });

  redirect(await getPostLoginRedirect(user.id, user.role));
}
