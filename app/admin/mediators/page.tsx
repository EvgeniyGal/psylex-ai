import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import { createMediator } from "@/app/admin/mediators/actions";
import { updateParticipantMeta } from "@/app/admin/sessions/actions";
import { Button } from "@/components/ui/button";
import { CredentialActions } from "@/components/credential-actions";

export default async function AdminMediatorsPage() {
  const sessionRows = await db.select().from(sessions);
  const mediators = await db.select().from(users).where(eq(users.role, "mediator"));
  const sessionsWithoutMediator = await Promise.all(
    sessionRows.map(async (session) => {
      const [found] = await db
        .select()
        .from(users)
        .where(and(eq(users.sessionId, session.id), eq(users.role, "mediator")))
        .limit(1);
      return found ? null : session;
    }),
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-card p-5">
        <h2 className="text-xl font-semibold">Mediators</h2>
        <p className="text-muted">Create one mediator per session.</p>
        <form action={createMediator} className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="rounded-md border border-white/20 bg-bg px-3 py-2" name="sessionId" required>
            <option value="">Select session</option>
            {sessionsWithoutMediator.filter(Boolean).map((session) => (
              <option key={session!.id} value={session!.id}>
                {session!.title}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-white/20 bg-bg px-3 py-2"
            name="title"
            placeholder="Mediator title"
            defaultValue="Mediator"
          />
          <input
            className="rounded-md border border-white/20 bg-bg px-3 py-2"
            name="description"
            placeholder="Mediator description"
            defaultValue="Session mediator"
          />
          <Button type="submit">Create Mediator</Button>
        </form>
      </div>

      <div className="grid gap-4">
        {mediators.map((mediator) => (
          <article key={mediator.id} className="rounded-xl border border-white/10 bg-card p-5">
            <p className="mb-2 font-semibold">Mediator</p>
            <form action={updateParticipantMeta} className="grid gap-2 md:grid-cols-3">
              <input type="hidden" name="userId" value={mediator.id} />
              <input type="hidden" name="role" value={mediator.role} />
              <input
                className="rounded-md border border-white/20 bg-bg px-3 py-2"
                defaultValue={mediator.title}
                name="title"
              />
              <input
                className="rounded-md border border-white/20 bg-bg px-3 py-2 md:col-span-2"
                defaultValue={mediator.description}
                name="description"
              />
              <div className="md:col-span-3">
                <Button type="submit" variant="outline">
                  Save Mediator Meta
                </Button>
              </div>
            </form>
            <p className="mt-3 text-sm">
              Login: <span className="font-mono">{mediator.login}</span>
            </p>
            <p className="text-sm">
              Password: <span className="font-mono">{mediator.password}</span>
            </p>
            <CredentialActions role="mediator" login={mediator.login} password={mediator.password} />
          </article>
        ))}
      </div>
    </section>
  );
}
