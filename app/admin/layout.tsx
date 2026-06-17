import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between rounded-xl border border-white/10 bg-card p-4">
        <h1 className="text-2xl font-semibold">PsyLex Admin</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="rounded-lg border border-white/20 px-3 py-1" href="/admin/settings">
            Settings
          </Link>
          <Link className="rounded-lg border border-white/20 px-3 py-1" href="/admin/sessions">
            Sessions
          </Link>
          <Link className="rounded-lg border border-white/20 px-3 py-1" href="/admin/mediators">
            Mediators
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
