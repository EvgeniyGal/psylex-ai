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

export function RoomExperience({ data }: RoomExperienceProps) {
  const { portal: t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("shared");

  const poll =
    data.pipeline.status === "pipeline_running" ||
    data.pipeline.status === "awaiting_clarification";

  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [poll, router]);

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
                {t.roomTabPrivate}
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
