"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { SituationForm } from "@/components/portal/room/situation-form";
import { PrivateThreadPanel, SharedRoomPanel } from "@/components/portal/room/room-panels";
import { useLocale } from "@/components/locale-provider";
import type { getRoomPageData } from "@/lib/room/queries";

type RoomExperienceProps = {
  data: NonNullable<Awaited<ReturnType<typeof getRoomPageData>>>;
};

type Tab = "shared" | "private";

const LIVE_UPDATE_INTERVAL_MS = 2000;

export function RoomExperience({ data }: RoomExperienceProps) {
  const { portal: t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("shared");

  const needsLiveUpdates =
    data.pipeline.status === "pipeline_running" ||
    data.pipeline.status === "awaiting_clarification" ||
    (data.allSidesSubmitted &&
      !data.activeOptionsMessage &&
      data.pipeline.status !== "options_published" &&
      data.pipeline.status !== "post_resolution");

  const hasUnreadPrivateAgentMessage =
    data.pipeline.status === "awaiting_clarification" &&
    data.privateMessages.at(-1)?.senderType === "agent";

  useEffect(() => {
    if (hasUnreadPrivateAgentMessage) {
      setTab("private");
    }
  }, [hasUnreadPrivateAgentMessage]);

  useEffect(() => {
    if (!needsLiveUpdates) return;

    router.refresh();
    const id = setInterval(() => router.refresh(), LIVE_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [needsLiveUpdates, router]);

  const showSituationForm = !data.hasSubmitted;

  return (
    <PortalPageShell>
      <main className="mx-auto w-full max-w-3xl space-y-6 px-gutter py-stack-lg">
        <div>
          <h1 className="font-display text-display-lg text-on-surface">{t.roomTitle}</h1>
          <p className="text-body-md text-on-surface-variant">{data.room.title}</p>
        </div>

        {showSituationForm ? (
          <SituationForm />
        ) : (
          <>
            <div className="flex gap-2 border-b border-outline-variant/20">
              <button
                className={
                  tab === "shared"
                    ? "border-b-2 border-tertiary px-4 py-3 font-display text-body-md font-semibold text-tertiary"
                    : "px-4 py-3 font-display text-body-md text-on-surface-variant hover:text-on-surface"
                }
                onClick={() => setTab("shared")}
                type="button"
              >
                {t.roomTabShared}
              </button>
              <button
                className={
                  tab === "private"
                    ? "border-b-2 border-tertiary px-4 py-3 font-display text-body-md font-semibold text-tertiary"
                    : "px-4 py-3 font-display text-body-md text-on-surface-variant hover:text-on-surface"
                }
                onClick={() => setTab("private")}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  {t.roomTabPrivate}
                  {hasUnreadPrivateAgentMessage && tab !== "private" ? (
                    <span className="h-2 w-2 rounded-full bg-tertiary" />
                  ) : null}
                </span>
              </button>
            </div>

            {tab === "shared" ? (
              <SharedRoomPanel
                activeOptionsMessage={data.activeOptionsMessage}
                hasSubmitted={data.hasSubmitted}
                messages={data.sharedMessages}
                pipelineStatus={data.pipeline.status}
                showSituationForm={false}
                visibleSituations={data.visibleSituations}
                waitingForOthers={data.waitingForOthers}
              />
            ) : (
              <PrivateThreadPanel messages={data.privateMessages} />
            )}
          </>
        )}
      </main>
    </PortalPageShell>
  );
}
