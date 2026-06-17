"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteSession,
  updateParticipantMeta,
  updateSessionMeta,
} from "@/app/admin/sessions/actions";
import { CredentialActions, CredentialField } from "@/components/credential-actions";
import { useLocale } from "@/components/locale-provider";

export type SessionUserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "plaintiff" | "defendant";
  title: string;
  description: string;
  sessionId: string | null;
};

export type SessionDetailRow = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

function roleIcon(role: string) {
  if (role === "plaintiff") return "person";
  if (role === "defendant") return "balance";
  return "group";
}

function ParticipantSection({ participant }: { participant: SessionUserRow }) {
  const { admin } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSave = (formData: FormData) => {
    startTransition(async () => {
      await updateParticipantMeta(formData);
      router.refresh();
    });
  };

  return (
    <section className="glass-panel rounded-xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={
            participant.role === "plaintiff"
              ? "flex h-10 w-10 items-center justify-center rounded bg-primary-container"
              : participant.role === "defendant"
                ? "flex h-10 w-10 items-center justify-center rounded bg-on-tertiary-container/20"
                : "flex h-10 w-10 items-center justify-center rounded bg-tertiary/20"
          }
        >
          <span
            className={
              participant.role === "plaintiff"
                ? "material-symbols-outlined text-primary"
                : "material-symbols-outlined text-tertiary"
            }
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {roleIcon(participant.role)}
          </span>
        </div>
        <p className="font-display text-headline-md text-on-surface">
          {admin.roles[participant.role] ?? participant.role}
        </p>
      </div>

      <form action={onSave} className="mb-5 space-y-3">
        <input name="userId" type="hidden" value={participant.id} />
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.titleLabel}</label>
          <input className={inputClass} defaultValue={participant.title} name="title" required />
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.descriptionLabel}</label>
          <textarea
            className={inputClass}
            defaultValue={participant.description}
            name="description"
            required
            rows={2}
          />
        </div>
        <button
          className="rounded border border-tertiary px-4 py-1.5 text-body-sm font-semibold text-tertiary transition-colors hover:bg-tertiary hover:text-on-tertiary disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "..." : admin.saveParticipant}
        </button>
      </form>

      <div className="space-y-4">
        <CredentialField label={admin.loginLabel} value={participant.login} />
        <CredentialField label={admin.passwordLabel} value={participant.password} />
      </div>
      <CredentialActions
        login={participant.login}
        password={participant.password}
        role={participant.role}
        userId={participant.id}
      />
    </section>
  );
}

export function SessionDetailContent({
  session,
  participants,
}: {
  session: SessionDetailRow;
  participants: SessionUserRow[];
}) {
  const { admin } = useLocale();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessionPending, startSessionTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const plaintiff = participants.find((p) => p.role === "plaintiff");
  const defendant = participants.find((p) => p.role === "defendant");
  const mediator = participants.find((p) => p.role === "mediator");
  const orderedParticipants = [plaintiff, defendant, mediator].filter(Boolean) as SessionUserRow[];

  const onSaveSession = (formData: FormData) => {
    startSessionTransition(async () => {
      await updateSessionMeta(formData);
      router.refresh();
    });
  };

  const onDelete = (formData: FormData) => {
    startDeleteTransition(async () => {
      await deleteSession(formData);
    });
  };

  return (
    <section className="space-y-stack-lg">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary transition-colors hover:text-on-surface"
        href="/admin/sessions"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToSessions}
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-headline-lg text-on-surface">{session.title}</h3>
            <span className="status-chip-active flex items-center gap-1 rounded px-3 py-1 font-display text-label-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />
              {admin.active}
            </span>
          </div>
          <p className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <form
        action={onSaveSession}
        className="glass-panel space-y-4 rounded-xl p-6"
      >
        <input name="sessionId" type="hidden" value={session.id} />
        <h4 className="font-display text-headline-md text-on-surface">{admin.sessionDetails}</h4>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.sessionTitleLabel}</label>
          <input className={inputClass} defaultValue={session.title} name="title" required />
        </div>
        <div>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.sessionDescriptionLabel}</label>
          <textarea
            className={inputClass}
            defaultValue={session.description}
            name="description"
            required
            rows={3}
          />
        </div>
        <button
          className="rounded-lg border border-tertiary px-5 py-2 text-body-sm font-semibold text-tertiary transition-colors hover:bg-tertiary hover:text-on-tertiary disabled:opacity-60"
          disabled={sessionPending}
          type="submit"
        >
          {sessionPending ? "..." : admin.save}
        </button>
      </form>

      <div>
        <h4 className="mb-4 font-display text-headline-md text-on-surface">{admin.participants}</h4>
        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          {orderedParticipants.map((participant) => (
            <ParticipantSection key={participant.id} participant={participant} />
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-error/20 p-6">
        {!confirmDelete ? (
          <button
            className="flex items-center gap-2 text-body-sm font-semibold text-error transition-opacity hover:opacity-80"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {admin.deleteSession}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface">{admin.deleteSessionConfirm}</p>
            <div className="flex gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 text-body-sm text-on-surface-variant hover:bg-surface-container-high"
                disabled={deletePending}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                {admin.cancel}
              </button>
              <form action={onDelete}>
                <input name="sessionId" type="hidden" value={session.id} />
                <button
                  className="rounded-lg bg-error px-4 py-2 text-body-sm font-semibold text-white disabled:opacity-60"
                  disabled={deletePending}
                  type="submit"
                >
                  {deletePending ? "..." : admin.deleteSession}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
