"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type UserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "plaintiff" | "defendant";
  title: string;
  description: string;
  sessionId: string | null;
};

type SessionRow = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

type SortKey = "title" | "description" | "plaintiff" | "defendant" | "createdAt";
type SortDir = "asc" | "desc";

type SessionTableRow = SessionRow & {
  plaintiffTitle: string;
  defendantTitle: string;
};

function SortIcon({ active, direction }: { active: boolean; direction: SortDir }) {
  if (!active) {
    return (
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">unfold_more</span>
    );
  }
  return (
    <span className="material-symbols-outlined text-[16px] text-tertiary">
      {direction === "asc" ? "arrow_upward" : "arrow_downward"}
    </span>
  );
}

export function SessionsContent({
  sessionRows,
  participantsBySession,
}: {
  sessionRows: SessionRow[];
  participantsBySession: { sessionId: string; users: UserRow[] }[];
}) {
  const { admin } = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const tableRows = useMemo<SessionTableRow[]>(() => {
    return sessionRows.map((session) => {
      const participants =
        participantsBySession.find((item) => item.sessionId === session.id)?.users ?? [];
      const plaintiff = participants.find((p) => p.role === "plaintiff");
      const defendant = participants.find((p) => p.role === "defendant");

      return {
        ...session,
        createdAt: new Date(session.createdAt),
        plaintiffTitle: plaintiff?.title ?? "",
        defendantTitle: defendant?.title ?? "",
      };
    });
  }, [sessionRows, participantsBySession]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tableRows;

    return tableRows.filter((row) => {
      const haystack = [
        row.title,
        row.description,
        row.plaintiffTitle,
        row.defendantTitle,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tableRows, search]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const multiplier = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      if (sortKey === "createdAt") {
        return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier;
      }

      const value = (row: SessionTableRow) => {
        if (sortKey === "plaintiff") return row.plaintiffTitle;
        if (sortKey === "defendant") return row.defendantTitle;
        return row[sortKey];
      };

      return value(a).localeCompare(value(b), undefined, { sensitivity: "base" }) * multiplier;
    });

    return rows;
  }, [filteredRows, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "title", label: admin.sessionTitleLabel },
    { key: "description", label: admin.sessionDescriptionLabel },
    { key: "plaintiff", label: admin.roles.plaintiff },
    { key: "defendant", label: admin.roles.defendant },
    { key: "createdAt", label: admin.tableCreatedAt },
  ];

  return (
    <section className="space-y-stack-lg">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.sessionsTitle}</h3>
          <p className="max-w-xl text-on-surface-variant">{admin.sessionsSubtitle}</p>
        </div>
        <Link
          className="flex items-center gap-2 rounded-lg bg-tertiary px-8 py-3 font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 active:scale-95"
          href="/admin/sessions/new"
        >
          <span className="material-symbols-outlined">add</span>
          {admin.newSession}
        </Link>
      </div>

      {sessionRows.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">{admin.noSessions}</div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={admin.searchPlaceholder}
              type="search"
              value={search}
            />
          </div>

          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-low/30">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-highest/40">
                  {columns.map((column) => (
                    <th className="px-4 py-3" key={column.key}>
                      <button
                        className="flex w-full items-center gap-1 font-display text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
                        onClick={() => onSort(column.key)}
                        type="button"
                      >
                        <span>{column.label}</span>
                        <SortIcon active={sortKey === column.key} direction={sortDir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-display text-label-md text-on-surface-variant">{admin.tableStatus}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-on-surface-variant" colSpan={columns.length + 2}>
                      {admin.noSearchResults}
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((session) => (
                    <tr
                      className="cursor-pointer border-b border-outline-variant/10 transition-colors last:border-b-0 hover:bg-surface-container-high/60"
                      key={session.id}
                      onClick={() => router.push(`/admin/sessions/${session.id}`)}
                    >
                      <td className="px-4 py-3 font-display text-body-md font-semibold text-on-surface">
                        {session.title}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-body-sm text-on-surface-variant">
                        {session.description}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">{session.plaintiffTitle || "—"}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">{session.defendantTitle || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-body-sm text-on-surface-variant">
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="status-chip-active inline-flex items-center gap-1 rounded px-2 py-0.5 font-display text-label-md">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />
                          {admin.active}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-stack-lg grid grid-cols-1 gap-6 border-t border-outline-variant/10 pt-8 md:grid-cols-3">
        <div className="glass-panel relative overflow-hidden rounded-xl p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-tertiary" />
          <h5 className="mb-4 font-display text-label-md tracking-wider text-tertiary">{admin.systemHealth}</h5>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">100%</span>
            <span className="mb-1 flex items-center text-sm text-emerald-500">
              <span className="material-symbols-outlined text-sm">trending_up</span> {admin.stable}
            </span>
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">{admin.systemHealthDesc}</p>
        </div>
        <div className="glass-panel relative overflow-hidden rounded-xl p-6 md:col-span-2">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
          <h5 className="mb-4 font-display text-label-md tracking-wider text-primary">{admin.aiInsight}</h5>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-primary/50">psychology</span>
            <p className="text-body-md font-light italic leading-relaxed text-on-surface/80">{admin.aiInsightDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
