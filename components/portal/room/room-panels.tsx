"use client";

import { useTransition } from "react";
import { sendPrivateReply, sendSharedMessage } from "@/app/(participant)/room/actions";
import { useLocale } from "@/components/locale-provider";
import type { RoomMessageView } from "@/lib/room/queries";

const inputClass =
  "w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-on-surface focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary";

function MessageList({ messages, agentLabel }: { messages: RoomMessageView[]; agentLabel: string }) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          className={
            m.senderType === "agent"
              ? "rounded-xl border border-tertiary/20 bg-tertiary/5 p-4"
              : "rounded-xl border border-outline-variant/10 bg-surface-container-high p-4"
          }
          key={m.id}
        >
          <p className="mb-1 text-label-sm font-semibold text-on-surface-variant">
            {m.senderType === "agent" ? agentLabel : m.senderRole ?? "participant"}
          </p>
          <p className="whitespace-pre-wrap text-body-md text-on-surface">{m.content}</p>
        </div>
      ))}
    </div>
  );
}

type SharedRoomPanelProps = {
  messages: RoomMessageView[];
  visibleSituations: {
    role: string;
    title: string;
    whatHappened: string;
    whyDispute: string;
    supportingInfo: string;
  }[];
  hasSubmitted: boolean;
  waitingForOthers: boolean;
  pipelineStatus: string;
  activeOptionsMessage: RoomMessageView | null | undefined;
  showSituationForm: boolean;
};

export function SharedRoomPanel({
  messages,
  visibleSituations,
  hasSubmitted,
  waitingForOthers,
  pipelineStatus,
  activeOptionsMessage,
  showSituationForm,
}: SharedRoomPanelProps) {
  const { portal: t } = useLocale();
  const [pending, startTransition] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const canChat =
    pipelineStatus === "options_published" || pipelineStatus === "post_resolution";

  const onSend = (formData: FormData) => {
    startTransition(async () => {
      await sendSharedMessage(formData);
    });
  };

  const onReject = (formData: FormData) => {
    startReject(async () => {
      formData.set("intent", "reject");
      await sendSharedMessage(formData);
    });
  };

  return (
    <div className="space-y-6">
      {showSituationForm ? null : (
        <>
          {visibleSituations.map((s) => (
            <div className="glass-panel rounded-xl p-5" key={s.role}>
              <h3 className="mb-2 font-display text-headline-md text-on-surface">
                {s.title || s.role}
              </h3>
              <p className="text-body-sm font-semibold text-on-surface-variant">{t.roomWhatHappened}</p>
              <p className="mb-2 whitespace-pre-wrap text-body-md">{s.whatHappened}</p>
              <p className="text-body-sm font-semibold text-on-surface-variant">{t.roomWhyDispute}</p>
              <p className="mb-2 whitespace-pre-wrap text-body-md">{s.whyDispute}</p>
              {s.supportingInfo ? (
                <>
                  <p className="text-body-sm font-semibold text-on-surface-variant">{t.roomSupportingInfo}</p>
                  <p className="whitespace-pre-wrap text-body-md">{s.supportingInfo}</p>
                </>
              ) : null}
            </div>
          ))}

          {waitingForOthers ? (
            <p className="text-body-md text-on-surface-variant">{t.roomWaitingOthers}</p>
          ) : null}

          {pipelineStatus === "pipeline_running" ? (
            <p className="text-body-md text-tertiary">{t.roomPipelineRunning}</p>
          ) : null}

          {pipelineStatus === "awaiting_clarification" ? (
            <p className="text-body-md text-tertiary">{t.roomAwaitingClarification}</p>
          ) : null}

          {activeOptionsMessage ? (
            <div className="glass-panel rounded-xl border border-primary/20 p-5">
              <h3 className="mb-3 font-display text-headline-md text-primary">{t.roomOptionsTitle}</h3>
              <p className="whitespace-pre-wrap text-body-md">{activeOptionsMessage.content}</p>
            </div>
          ) : null}

          <MessageList agentLabel={t.roomAgentLabel} messages={messages} />

          {canChat ? (
            <div className="space-y-3">
              <form action={onSend} className="flex gap-2">
                <input
                  className={inputClass}
                  name="content"
                  placeholder={t.roomSharedPlaceholder}
                  required
                />
                <button
                  className="btn-primary shrink-0 px-4 py-2 font-display text-label-md disabled:opacity-60"
                  disabled={pending}
                  type="submit"
                >
                  {t.roomSend}
                </button>
              </form>
              <form action={onReject} className="flex gap-2">
                <input
                  className={inputClass}
                  name="content"
                  placeholder={t.roomRejectOptions}
                  required
                />
                <button
                  className="rounded-lg border border-outline-variant/30 px-4 py-2 text-label-md text-on-surface transition-colors hover:border-tertiary disabled:opacity-60"
                  disabled={rejectPending}
                  type="submit"
                >
                  {t.roomRejectOptions}
                </button>
              </form>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function PrivateThreadPanel({ messages }: { messages: RoomMessageView[] }) {
  const { portal: t } = useLocale();
  const [pending, startTransition] = useTransition();

  const onSend = (formData: FormData) => {
    startTransition(async () => {
      await sendPrivateReply(formData);
    });
  };

  return (
    <div className="space-y-4">
      <MessageList agentLabel={t.roomAgentLabel} messages={messages} />
      <form action={onSend} className="flex gap-2">
        <input
          className={inputClass}
          name="content"
          placeholder={t.roomPrivatePlaceholder}
          required
        />
        <button
          className="btn-primary shrink-0 px-4 py-2 font-display text-label-md disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {t.roomSend}
        </button>
      </form>
    </div>
  );
}
