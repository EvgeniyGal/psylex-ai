"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import { formatCredentials } from "@/lib/credentials";
import type { RoomJurisdiction } from "@/lib/room/jurisdiction";
import { jurisdictionLabels } from "@/lib/room/jurisdiction";
import { compareStringsStable } from "@/lib/utils";

type UserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "side1" | "side2";
  title: string;
  description: string;
  roomId: string | null;
};

type RoomRow = {
  id: string;
  title: string;
  description: string;
  jurisdiction: RoomJurisdiction;
  createdAt: Date;
  createdByUserId?: string | null;
  mediatorTitle?: string | null;
};

type SortKey = "title" | "description" | "jurisdiction" | "sides" | "mediator";
type SortDir = "asc" | "desc";
type RoomListTab = "admin" | "mediator";

type RoomTableRow = RoomRow & {
  side1: UserRow | null;
  side2: UserRow | null;
  side1Title: string;
  side2Title: string;
  mediatorTitle: string;
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

function SideRow({
  participant,
  title,
  onCopy,
  copyLabel,
  showCredentialCopy,
}: {
  participant: UserRow | null;
  title: string;
  onCopy: (participant: UserRow) => void;
  copyLabel: string;
  showCredentialCopy: boolean;
}) {
  if (!title) {
    return <div className="text-body-sm text-on-surface-variant">—</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-body-sm text-on-surface">{title}</span>
      {participant && showCredentialCopy ? (
        <button
          className="flex shrink-0 items-center justify-center rounded-lg border border-outline-variant/30 p-1.5 text-on-surface transition-colors hover:border-tertiary hover:text-tertiary"
          onClick={() => onCopy(participant)}
          title={copyLabel}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          <span className="sr-only">{copyLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

function SidesCell({
  side1,
  side2,
  side1Title,
  side2Title,
  onCopy,
  copyLabel,
  showCredentialCopy,
}: {
  side1: UserRow | null;
  side2: UserRow | null;
  side1Title: string;
  side2Title: string;
  onCopy: (participant: UserRow) => void;
  copyLabel: string;
  showCredentialCopy: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SideRow copyLabel={copyLabel} onCopy={onCopy} participant={side1} showCredentialCopy={showCredentialCopy} title={side1Title} />
      <SideRow copyLabel={copyLabel} onCopy={onCopy} participant={side2} showCredentialCopy={showCredentialCopy} title={side2Title} />
    </div>
  );
}

export function RoomsContent({
  roomRows,
  participantsByRoom,
  basePath = "/admin/rooms",
  showCreateButton = true,
  showInsights = true,
  showCredentialCopy = true,
  showRoomTabs = false,
}: {
  roomRows: RoomRow[];
  participantsByRoom: { roomId: string; users: UserRow[] }[];
  basePath?: string;
  showCreateButton?: boolean;
  showInsights?: boolean;
  showCredentialCopy?: boolean;
  showRoomTabs?: boolean;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoomListTab>("admin");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const jurisdictionDisplay = jurisdictionLabels(locale);

  const tableRows = useMemo<RoomTableRow[]>(() => {
    return roomRows.map((room) => {
      const participants =
        participantsByRoom.find((item) => item.roomId === room.id)?.users ?? [];
      const side1 = participants.find((p) => p.role === "side1") ?? null;
      const side2 = participants.find((p) => p.role === "side2") ?? null;

      return {
        ...room,
        createdAt: new Date(room.createdAt),
        side1,
        side2,
        side1Title: side1?.title ?? "",
        side2Title: side2?.title ?? "",
        mediatorTitle: room.mediatorTitle ?? admin.unknownMediator,
      };
    });
  }, [roomRows, participantsByRoom, admin.unknownMediator]);

  const tabRows = useMemo(() => {
    if (!showRoomTabs) return tableRows;
    if (activeTab === "admin") {
      return tableRows.filter((row) => !row.createdByUserId);
    }
    return tableRows.filter((row) => !!row.createdByUserId);
  }, [tableRows, showRoomTabs, activeTab]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tabRows;

    return tabRows.filter((row) => {
      const haystack = [
        row.title,
        row.description,
        row.side1Title,
        row.side2Title,
        row.mediatorTitle,
        jurisdictionDisplay[row.jurisdiction],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tabRows, search, jurisdictionDisplay]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const multiplier = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const value = (row: RoomTableRow) => {
        if (sortKey === "sides") return `${row.side1Title} ${row.side2Title}`;
        if (sortKey === "jurisdiction") return jurisdictionDisplay[row.jurisdiction];
        if (sortKey === "mediator") return row.mediatorTitle;
        return row[sortKey];
      };

      const compare = compareStringsStable(value(a), value(b));
      if (compare !== 0) return compare * multiplier;
      return compareStringsStable(a.id, b.id) * multiplier;
    });

    return rows;
  }, [filteredRows, sortKey, sortDir, jurisdictionDisplay]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const onCopyCredentials = async (participant: UserRow) => {
    const text = formatCredentials({
      role: participant.role,
      login: participant.login,
      password: participant.password,
    });
    await navigator.clipboard.writeText(text);
    toast.success(admin.copyCredentials);
  };

  const showMediatorColumn = showRoomTabs && activeTab === "mediator";

  const columns: { key: SortKey; label: string }[] = [
    ...(showMediatorColumn
      ? [{ key: "mediator" as const, label: admin.mediatorTitleLabel }]
      : []),
    { key: "title", label: admin.roomTitleLabel },
    { key: "description", label: admin.roomDescriptionLabel },
    { key: "jurisdiction", label: admin.jurisdictionLabel },
    { key: "sides", label: admin.tableSides },
  ];

  const emptyMessage = () => {
    if (showRoomTabs) {
      return activeTab === "admin" ? admin.noAdminRooms : admin.noMediatorRooms;
    }
    return admin.noRooms;
  };

  const showCreate = showCreateButton && (!showRoomTabs || activeTab === "admin");

  return (
    <section className="space-y-stack-lg">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.roomsTitle}</h3>
          <p className="max-w-xl text-on-surface-variant">{admin.roomsSubtitle}</p>
        </div>
        {showCreate ? (
          <Link
            className="flex items-center gap-2 rounded-lg bg-tertiary px-8 py-3 font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110 active:scale-95"
            href={`${basePath}/new`}
          >
            <span className="material-symbols-outlined">add</span>
            {admin.newRoom}
          </Link>
        ) : null}
      </div>

      {showRoomTabs ? (
        <div className="flex gap-2 border-b border-outline-variant/20">
          {(["admin", "mediator"] as const).map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "border-b-2 border-tertiary px-4 py-3 font-display text-body-md font-semibold text-tertiary"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
                setSortKey("title");
                setSortDir("asc");
              }}
              type="button"
            >
              {tab === "admin" ? admin.tabAdminRooms : admin.tabMediatorRooms}
            </button>
          ))}
        </div>
      ) : null}

      {tabRows.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">{emptyMessage()}</div>
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
                  <th className="w-0 whitespace-nowrap px-4 py-3">
                    <span className="sr-only">{admin.tableActions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-on-surface-variant" colSpan={columns.length + 1}>
                      {admin.noSearchResults}
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((room) => (
                    <tr
                      className="border-b border-outline-variant/10 transition-colors last:border-b-0 hover:bg-surface-container-high/60"
                      key={room.id}
                    >
                      {showMediatorColumn ? (
                        <td className="px-4 py-3 text-body-sm text-on-surface">{room.mediatorTitle}</td>
                      ) : null}
                      <td className="px-4 py-3 font-display text-body-md font-semibold text-on-surface">
                        {room.title}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-body-sm text-on-surface-variant">
                        {room.description}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">
                        {jurisdictionDisplay[room.jurisdiction]}
                      </td>
                      <td className="px-4 py-3">
                        <SidesCell
                          copyLabel={admin.copyCredentials}
                          onCopy={onCopyCredentials}
                          showCredentialCopy={showCredentialCopy}
                          side1={room.side1}
                          side1Title={room.side1Title}
                          side2={room.side2}
                          side2Title={room.side2Title}
                        />
                      </td>
                      <td className="w-0 whitespace-nowrap px-4 py-3">
                        <button
                          className="flex items-center justify-center rounded-lg border border-outline-variant/30 p-2 text-on-surface transition-colors hover:border-tertiary hover:text-tertiary"
                          onClick={() => router.push(`${basePath}/${room.id}`)}
                          title={admin.openCard}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          <span className="sr-only">{admin.openCard}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInsights ? (
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
      ) : null}
    </section>
  );
}
