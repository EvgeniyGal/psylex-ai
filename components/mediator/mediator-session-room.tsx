"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchMediatorSessionState,
  generateMediatorOptionsAction,
  generateMediatorQuestionCandidatesAction,
  publishMediatorCompromiseAction,
  sendMediatorQuestionAction,
} from "@/app/mediator/rooms/actions";
import { SessionElapsedTimer } from "@/components/mediator/session-elapsed-timer";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import type { MediatorSessionRoomState } from "@/lib/mediator-session/orchestrator";
import type { PartyRole } from "@/lib/participant-roles";
import type { MediationOption } from "@/lib/mediation/types";

type MediatorSessionRoomProps = {
  roomId: string;
  initialState: MediatorSessionRoomState;
};

export function MediatorSessionRoom({ roomId, initialState }: MediatorSessionRoomProps) {
  const { admin, portal: t } = useLocale();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [selectedParty, setSelectedParty] = useState<PartyRole>("party_a");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [compromiseEdit, setCompromiseEdit] = useState<MediationOption | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorSessionState(roomId);
      if (next) setState(next);
    } catch {
      /* ignore */
    }
  }, [roomId]);

  useRoomRealtime(roomId, () => {
    void refresh();
  }, {
    watchUsers: false,
  });

  useEffect(() => {
    if (state.compromiseDraft && !state.compromisePublished) {
      setCompromiseEdit({
        id: state.compromiseDraft.id,
        canonicalDescription: state.compromiseDraft.canonicalDescription,
        legalNorms: state.compromiseDraft.legalNorms,
        fulfillmentProbability: state.compromiseDraft.fulfillmentProbability,
        refusalRisks: state.compromiseDraft.refusalRisks,
        partyA: state.compromiseDraft.partyA,
        partyB: state.compromiseDraft.partyB,
      });
    }
  }, [state.compromiseDraft, state.compromisePublished]);

  const candidates =
    selectedParty === "party_a"
      ? state.questionCandidates.party_a
      : state.questionCandidates.party_b;

  const onSelectCandidate = (id: string) => {
    setSelectedCandidateId(id);
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return;
    setEditText(selectedParty === "party_a" ? candidate.partyA : candidate.partyB);
  };

  const onGenerateQuestions = () => {
    startTransition(async () => {
      try {
        await generateMediatorQuestionCandidatesAction(roomId);
        await refresh();
        toast.success(admin.mediatorGenerateQuestions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onSendQuestion = () => {
    if (!selectedCandidateId) return;
    startTransition(async () => {
      try {
        const next = await sendMediatorQuestionAction({
          roomId,
          partyRole: selectedParty,
          candidateId: selectedCandidateId,
          editedText: editText,
        });
        if (next) setState(next);
        setSelectedCandidateId(null);
        setEditText("");
        toast.success(admin.mediatorSendQuestion);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onGenerateOptions = () => {
    startTransition(async () => {
      try {
        const next = await generateMediatorOptionsAction(roomId);
        if (next) setState(next);
        toast.success(admin.mediatorGenerateOptions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onPublishCompromise = () => {
    if (!compromiseEdit) return;
    startTransition(async () => {
      try {
        const next = await publishMediatorCompromiseAction({
          roomId,
          draft: compromiseEdit,
        });
        if (next) setState(next);
        toast.success(admin.mediatorPublishCompromise);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary hover:text-on-surface"
          href={`/mediator/rooms/${roomId}`}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          {admin.returnToRooms}
        </Link>
        <SessionElapsedTimer startedAt={state.room.mediationStartedAt} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1.4fr)_320px]">
        <aside className="glass-panel space-y-4 rounded-xl p-4">
          <h3 className="font-display text-label-md uppercase text-on-surface-variant">
            {admin.mediatorProfilesTitle}
          </h3>
          {state.profiles ? (
            <>
              <ProfileCard title={state.profiles.partyA.title} profile={state.profiles.partyA.psychodynamic} />
              <ProfileCard title={state.profiles.partyB.title} profile={state.profiles.partyB.psychodynamic} />
            </>
          ) : null}
        </aside>

        <div className="glass-panel flex min-h-[28rem] flex-col rounded-xl p-4">
          <p className="mb-3 text-body-sm text-on-surface-variant">
            {t.mediationPhaseLabel}: {state.room.phase ?? "—"}
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {state.messages.map((message) => (
              <div
                className="rounded-lg border border-hair bg-paper/60 px-3 py-2 text-body-sm text-on-surface"
                key={message.id}
              >
                <p className="mb-1 text-label-md uppercase text-on-surface-variant">
                  {message.senderType}
                  {message.messageKind ? ` · ${message.messageKind}` : ""}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="glass-panel space-y-4 rounded-xl p-4">
          <div className="flex gap-2">
            {(["party_a", "party_b"] as const).map((role) => (
              <button
                className={`rounded-md px-3 py-1.5 text-body-sm ${
                  selectedParty === role ? "bg-law text-white" : "bg-surface-container-high text-on-surface"
                }`}
                key={role}
                onClick={() => {
                  setSelectedParty(role);
                  setSelectedCandidateId(null);
                  setEditText("");
                }}
                type="button"
              >
                {t.roles[role]}
              </button>
            ))}
          </div>

          <button
            className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
            disabled={pending || state.room.phase === "completed"}
            onClick={onGenerateQuestions}
            type="button"
          >
            {pending ? <Spinner className="text-white" size="sm" /> : null}
            {admin.mediatorGenerateQuestions}
          </button>

          <div className="space-y-2">
            <p className="text-label-md uppercase text-on-surface-variant">
              {admin.mediatorQuestionCandidates}
            </p>
            {candidates.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">{admin.mediatorSelectCandidate}</p>
            ) : (
              candidates.map((candidate) => (
                <button
                  className={`block w-full rounded-md border px-3 py-2 text-left text-body-sm ${
                    selectedCandidateId === candidate.id
                      ? "border-law bg-law/10"
                      : "border-hair bg-paper"
                  }`}
                  key={candidate.id}
                  onClick={() => onSelectCandidate(candidate.id)}
                  type="button"
                >
                  {selectedParty === "party_a" ? candidate.partyA : candidate.partyB}
                </button>
              ))
            )}
          </div>

          {selectedCandidateId ? (
            <div className="space-y-2">
              <label className="text-body-sm text-on-surface-variant">{admin.mediatorEditQuestion}</label>
              <textarea
                className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-body-sm"
                onChange={(event) => setEditText(event.target.value)}
                rows={4}
                value={editText}
              />
              <button
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || !editText.trim()}
                onClick={onSendQuestion}
                type="button"
              >
                {admin.mediatorSendQuestion}
              </button>
            </div>
          ) : null}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md border border-law px-3 py-2 text-body-sm font-semibold text-law disabled:opacity-60"
            disabled={pending || state.room.phase === "completed" || state.room.phase === "agreement"}
            onClick={onGenerateOptions}
            type="button"
          >
            {admin.mediatorGenerateOptions}
          </button>

          {state.room.phase === "voting_discrepancy" && compromiseEdit && !state.compromisePublished ? (
            <div className="space-y-2 border-t border-hair pt-3">
              <p className="text-label-md uppercase text-on-surface-variant">
                {admin.mediatorCompromiseDraft}
              </p>
              <textarea
                className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-body-sm"
                onChange={(event) =>
                  setCompromiseEdit((prev) =>
                    prev ? { ...prev, canonicalDescription: event.target.value, partyA: event.target.value, partyB: event.target.value } : prev,
                  )
                }
                rows={4}
                value={compromiseEdit.canonicalDescription}
              />
              <button
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-2 text-body-sm"
                disabled={pending}
                onClick={onPublishCompromise}
                type="button"
              >
                {admin.mediatorPublishCompromise}
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function ProfileCard({ title, profile }: { title: string; profile: unknown }) {
  return (
    <div className="rounded-md border border-hair bg-paper/70 p-3">
      <p className="mb-1 font-semibold text-body-sm text-on-surface">{title}</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-on-surface-variant">
        {profile ? JSON.stringify(profile, null, 2) : "—"}
      </pre>
    </div>
  );
}
