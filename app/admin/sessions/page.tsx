import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import {
  createSession,
  updateParticipantMeta,
  updateSessionMeta,
} from "@/app/admin/sessions/actions";
import { Button } from "@/components/ui/button";
import { CredentialActions } from "@/components/credential-actions";

export default async function AdminSessionsPage() {
  const sessionRows = await db.select().from(sessions).orderBy(desc(sessions.createdAt));

  const participantsBySession = await Promise.all(
    sessionRows.map(async (session) => ({
      sessionId: session.id,
      users: await db.select().from(users).where(eq(users.sessionId, session.id)),
    })),
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-card p-5">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <p className="text-muted">Create sessions and manage participant credentials.</p>
        <form action={createSession} className="mt-4">
          <Button type="submit">Create Session</Button>
        </form>
      </div>

      {sessionRows.map((session) => {
        const participants =
          participantsBySession.find((item) => item.sessionId === session.id)?.users ?? [];
        return (
          <article key={session.id} className="rounded-xl border border-white/10 bg-card p-5">
            <div className="mb-4">
              <form action={updateSessionMeta} className="grid gap-2 md:grid-cols-3">
                <input name="sessionId" type="hidden" value={session.id} />
                <input
                  className="rounded-md border border-white/20 bg-bg px-3 py-2"
                  defaultValue={session.title}
                  name="title"
                  placeholder="Session title"
                />
                <input
                  className="rounded-md border border-white/20 bg-bg px-3 py-2 md:col-span-2"
                  defaultValue={session.description}
                  name="description"
                  placeholder="Session description"
                />
                <div className="md:col-span-3">
                  <Button type="submit" variant="outline">
                    Save Session Meta
                  </Button>
                </div>
              </form>
              <p className="mt-2 text-xs text-muted">
                Created: {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {participants.map((participant) => (
                <div key={participant.id} className="rounded-lg border border-white/10 bg-bg p-4">
                  <p className="mb-2 font-semibold capitalize">{participant.role}</p>
                  <form action={updateParticipantMeta} className="space-y-2">
                    <input type="hidden" name="userId" value={participant.id} />
                    <input type="hidden" name="role" value={participant.role} />
                    <input
                      className="w-full rounded-md border border-white/20 bg-card px-3 py-2"
                      defaultValue={participant.title}
                      name="title"
                      placeholder="Title"
                    />
                    <input
                      className="w-full rounded-md border border-white/20 bg-card px-3 py-2"
                      defaultValue={participant.description}
                      name="description"
                      placeholder="Description"
                    />
                    <Button type="submit" variant="outline">
                      Save Participant Meta
                    </Button>
                  </form>
                  <p className="mt-3 text-sm">
                    Login: <span className="font-mono">{participant.login}</span>
                  </p>
                  <p className="text-sm">
                    Password: <span className="font-mono">{participant.password}</span>
                  </p>
                  <CredentialActions
                    role={participant.role}
                    login={participant.login}
                    password={participant.password}
                  />
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
