"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type MediatorRow = {
  id: string;
  login: string;
  password: string;
  role: string;
  title: string;
  description: string;
};

type SortKey = "title" | "description" | "login";
type SortDir = "asc" | "desc";

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

export function MediatorsContent({ mediators }: { mediators: MediatorRow[] }) {
  const { admin } = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return mediators;

    return mediators.filter((mediator) => {
      const haystack = [mediator.title, mediator.description, mediator.login].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [mediators, search]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const multiplier = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const aVal = a[sortKey].toLowerCase();
      const bVal = b[sortKey].toLowerCase();
      return aVal.localeCompare(bVal, undefined, { sensitivity: "base" }) * multiplier;
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
    { key: "title", label: admin.titleLabel },
    { key: "description", label: admin.descriptionLabel },
    { key: "login", label: admin.loginLabel },
  ];

  return (
    <section className="space-y-stack-lg">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h3 className="mb-2 font-display text-display-lg text-on-surface">{admin.mediatorsTitle}</h3>
          <p className="text-body-md text-on-surface-variant">{admin.mediatorsSubtitle}</p>
        </div>
        <Link
          className="flex items-center gap-2 rounded-lg bg-tertiary px-8 py-3 font-bold text-on-tertiary shadow-lg transition-all hover:shadow-tertiary/10 active:scale-95"
          href="/admin/mediators/new"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_add
          </span>
          {admin.createMediator}
        </Link>
      </div>

      {mediators.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">{admin.noMediators}</div>
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
            <table className="w-full min-w-[720px] border-collapse text-left">
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
                  sortedRows.map((mediator) => (
                    <tr
                      className="cursor-pointer border-b border-outline-variant/10 transition-colors last:border-b-0 hover:bg-surface-container-high/60"
                      key={mediator.id}
                      onClick={() => router.push(`/admin/mediators/${mediator.id}`)}
                    >
                      <td className="px-4 py-3 font-display text-body-md font-semibold text-on-surface">
                        {mediator.title}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-body-sm text-on-surface-variant">
                        {mediator.description}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-body-sm text-on-surface">
                        {mediator.login}
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
    </section>
  );
}
