"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { formatDateTime } from "@/lib/format-datetime";

export type PipelineLogRow = {
  id: string;
  eventType: string;
  agentKey: string | null;
  createdAt: Date;
};

type PipelineLogContentProps = {
  roomId: string;
  roomTitle: string;
  pipelineStatus: string | null;
  logs: PipelineLogRow[];
};

export function PipelineLogContent({
  roomId,
  roomTitle,
  pipelineStatus,
  logs,
}: PipelineLogContentProps) {
  const { admin, locale } = useLocale();

  const statusLabel = pipelineStatus
    ? (admin.pipelineStatusValues[pipelineStatus] ?? pipelineStatus)
    : null;

  const eventLabel = (eventType: string) =>
    admin.pipelineEventLabels[eventType] ?? eventType;

  const agentLabel = (agentKey: string | null) => {
    if (!agentKey) return admin.tableEmpty;
    const map: Record<string, string> = {
      legal_domain: admin.agentLegalDomain,
      precedents: admin.agentPrecedents,
      compatibility: admin.agentCompatibility,
      synthesis: admin.agentSynthesis,
    };
    return map[agentKey] ?? agentKey;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-display-lg text-on-surface">{admin.pipelineLog}</h3>
          <p className="text-body-md text-on-surface-variant">{roomTitle}</p>
          {statusLabel ? (
            <p className="mt-1 text-label-md text-tertiary">
              {admin.pipelineStatus}: {statusLabel}
            </p>
          ) : null}
        </div>
        <Link
          className="rounded-lg border border-outline-variant/30 px-4 py-2 text-body-sm text-on-surface hover:border-tertiary"
          href={`/admin/rooms/${roomId}`}
        >
          {admin.backToRoom}
        </Link>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-outline-variant/20 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-semibold">{admin.tableTime}</th>
              <th className="px-4 py-3 font-semibold">{admin.tableEvent}</th>
              <th className="px-4 py-3 font-semibold">{admin.tableAgent}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-on-surface-variant" colSpan={3}>
                  {admin.noPipelineEvents}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr className="border-b border-outline-variant/10" key={log.id}>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDateTime(log.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-on-surface">{eventLabel(log.eventType)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{agentLabel(log.agentKey)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
