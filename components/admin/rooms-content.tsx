"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useLocale } from "@/components/locale-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/format-datetime";
import type { RoomJurisdiction } from "@/lib/room/jurisdiction";
import { formatRoomJurisdiction } from "@/lib/room/jurisdiction";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  login: string;
  password: string;
  role: "admin" | "mediator" | "party_a" | "party_b";
  title: string;
  description: string;
  roomId: string | null;
};

type RoomRow = {
  id: string;
  title: string;
  description: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction?: string | null;
  createdAt: Date;
  createdByUserId?: string | null;
  mediatorTitle?: string | null;
  scheduledStartAt?: Date | string | null;
  mediationStartedAt?: Date | string | null;
  mediationCompletedAt?: Date | string | null;
  mediationPhase?: string | null;
  preparationReady?: boolean;
};

type RoomListTab = "admin" | "mediator";

type RoomTableRow = RoomRow & {
  partyATitle: string;
  partyBTitle: string;
  mediatorTitle: string;
  jurisdictionLabel: string;
  scheduledStartAt: Date | null;
  mediationStartedAt: Date | null;
  sessionComplete: boolean;
  preparationReady: boolean;
  statusLabel: string;
  statusRank: number;
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted) {
    return (
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">unfold_more</span>
    );
  }
  return (
    <span className="material-symbols-outlined text-[16px] text-tertiary">
      {sorted === "asc" ? "arrow_upward" : "arrow_downward"}
    </span>
  );
}

export function RoomsContent({
  roomRows,
  participantsByRoom,
  basePath = "/admin/rooms",
  showCreateButton = true,
  showRoomTabs = false,
}: {
  roomRows: RoomRow[];
  participantsByRoom: { roomId: string; users: UserRow[] }[];
  basePath?: string;
  showCreateButton?: boolean;
  showRoomTabs?: boolean;
}) {
  const { admin, locale } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoomListTab>("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const globalFilter = useDebouncedValue(searchQuery, 300);
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [globalFilter]);

  const tableRows = useMemo<RoomTableRow[]>(() => {
    return roomRows.map((room) => {
      const participants =
        participantsByRoom.find((item) => item.roomId === room.id)?.users ?? [];
      const partyA = participants.find((p) => p.role === "party_a");
      const partyB = participants.find((p) => p.role === "party_b");
      const preparationReady = !!room.preparationReady;
      const scheduledRaw = room.scheduledStartAt ? new Date(room.scheduledStartAt) : null;
      const scheduledStartAt =
        scheduledRaw && !Number.isNaN(scheduledRaw.getTime()) ? scheduledRaw : null;
      const startedRaw = room.mediationStartedAt ? new Date(room.mediationStartedAt) : null;
      const mediationStartedAt =
        startedRaw && !Number.isNaN(startedRaw.getTime()) ? startedRaw : null;
      const completedRaw = room.mediationCompletedAt ? new Date(room.mediationCompletedAt) : null;
      const mediationCompletedAt =
        completedRaw && !Number.isNaN(completedRaw.getTime()) ? completedRaw : null;
      const sessionComplete =
        !!mediationCompletedAt || room.mediationPhase === "completed";
      const statusLabel = sessionComplete
        ? admin.tableStatusComplete
        : preparationReady
          ? admin.tableStatusReady
          : admin.tableStatusNotReady;
      const statusRank = sessionComplete ? 2 : preparationReady ? 1 : 0;

      return {
        ...room,
        createdAt: new Date(room.createdAt),
        partyATitle: partyA?.title ?? "",
        partyBTitle: partyB?.title ?? "",
        mediatorTitle: room.mediatorTitle ?? admin.unknownMediator,
        jurisdictionLabel: formatRoomJurisdiction(room, locale),
        scheduledStartAt,
        mediationStartedAt,
        sessionComplete,
        preparationReady,
        statusLabel,
        statusRank,
      };
    });
  }, [
    roomRows,
    participantsByRoom,
    admin.unknownMediator,
    admin.tableStatusReady,
    admin.tableStatusNotReady,
    admin.tableStatusComplete,
    locale,
  ]);

  const tabRows = useMemo(() => {
    if (!showRoomTabs) return tableRows;
    if (activeTab === "admin") {
      return tableRows.filter((row) => !row.createdByUserId);
    }
    return tableRows.filter((row) => !!row.createdByUserId);
  }, [tableRows, showRoomTabs, activeTab]);

  const showMediatorColumn = showRoomTabs && activeTab === "mediator";
  const showSessionActions = basePath.startsWith("/mediator");
  // Mode A (admin-created rooms) does not schedule sessions.
  const showScheduledColumn = showSessionActions || (showRoomTabs && activeTab === "mediator");

  const columns = useMemo<ColumnDef<RoomTableRow>[]>(() => {
    const defs: ColumnDef<RoomTableRow>[] = [];

    if (showMediatorColumn) {
      defs.push({
        accessorKey: "mediatorTitle",
        id: "mediator",
        header: admin.mediatorTitleLabel,
        cell: ({ getValue }) => (
          <span className="text-body-sm text-on-surface">{String(getValue() ?? "")}</span>
        ),
      });
    }

    defs.push(
      {
        accessorKey: "title",
        header: admin.roomTitleLabel,
        cell: ({ getValue }) => (
          <span className="font-display text-body-md font-semibold text-on-surface">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: admin.roomDescriptionLabel,
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate text-body-sm text-on-surface-variant">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        accessorKey: "jurisdictionLabel",
        id: "jurisdiction",
        header: admin.jurisdictionLabel,
        cell: ({ getValue }) => (
          <span className="text-body-sm text-on-surface">{String(getValue() ?? "")}</span>
        ),
      },
    );

    if (showScheduledColumn) {
      defs.push({
        accessorKey: "scheduledStartAt",
        id: "scheduled",
        header: admin.tableScheduledTime,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.scheduledStartAt?.getTime() ?? 0;
          const b = rowB.original.scheduledStartAt?.getTime() ?? 0;
          return a - b;
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-body-sm text-on-surface">
            {row.original.scheduledStartAt
              ? formatDateTime(row.original.scheduledStartAt, locale)
              : admin.scheduleNotSet}
          </span>
        ),
      });
    }

    defs.push({
      accessorKey: "statusRank",
      id: "status",
      header: admin.tablePreparationStatus,
      sortingFn: (rowA, rowB) => rowA.original.statusRank - rowB.original.statusRank,
      cell: ({ row }) => {
        const { sessionComplete, preparationReady, statusLabel } = row.original;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-label-md font-semibold",
              sessionComplete
                ? "bg-tertiary/15 text-tertiary"
                : preparationReady
                  ? "bg-success/15 text-success"
                  : "bg-error/15 text-error",
            )}
          >
            {statusLabel}
          </span>
        );
      },
    });

    if (showSessionActions) {
      defs.push({
        id: "sessionAction",
        header: admin.tableSessionAction,
        enableSorting: false,
        cell: ({ row }) => {
          const room = row.original;
          if (room.mediationStartedAt) {
            return (
              <Link
                className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-label-md"
                href={`${basePath}/${room.id}/session`}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                {admin.scheduleOpenSession}
              </Link>
            );
          }
          if (room.scheduledStartAt) {
            return (
              <Link
                className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-label-md"
                href={`${basePath}/${room.id}/lobby`}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                {admin.scheduleOpenLobby}
              </Link>
            );
          }
          return <span className="text-body-sm text-on-surface-variant">—</span>;
        },
      });
    }

    return defs;
  }, [admin, basePath, locale, showMediatorColumn, showScheduledColumn, showSessionActions]);

  const table = useReactTable({
    data: tabRows,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) return true;
      const haystack = [
        row.original.title,
        row.original.description,
        row.original.partyATitle,
        row.original.partyBTitle,
        row.original.mediatorTitle,
        row.original.jurisdictionLabel,
        row.original.statusLabel,
        ...(showScheduledColumn
          ? [
              row.original.scheduledStartAt
                ? formatDateTime(row.original.scheduledStartAt, locale)
                : admin.scheduleNotSet,
            ]
          : []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    },
  });

  const emptyMessage = () => {
    if (showRoomTabs) {
      return activeTab === "admin" ? admin.noAdminRooms : admin.noMediatorRooms;
    }
    return admin.noRooms;
  };

  const showCreate = showCreateButton && (!showRoomTabs || activeTab === "admin");
  const visibleRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageLabel = admin.tablePageOf
    .replace("{page}", String(table.getState().pagination.pageIndex + 1))
    .replace("{pages}", String(pageCount));

  return (
    <section className="space-y-stack-lg">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.roomsTitle}</h3>
          <p className="max-w-xl text-on-surface-variant">{admin.roomsSubtitle}</p>
        </div>
        {showCreate ? (
          <Link
            className="btn-primary flex items-center gap-2 px-8 py-3 active:translate-y-px"
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
                  ? "border-b-2 border-law px-4 py-3 font-display text-body-md font-semibold text-ink"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery("");
                setSorting([{ id: "title", desc: false }]);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
              className="w-full rounded-md border border-hair bg-paper py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={admin.searchPlaceholder}
              type="search"
              value={searchQuery}
            />
          </div>

          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-low/30">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    className="border-b border-outline-variant/10 bg-surface-container-highest/40"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <th className="px-4 py-3" key={header.id}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="flex w-full items-center gap-1 font-display text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          <span className="font-display text-label-md text-on-surface-variant">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-on-surface-variant"
                      colSpan={columns.length}
                    >
                      {admin.noSearchResults}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      className={cn(
                        "cursor-pointer border-b border-outline-variant/10 transition-colors last:border-b-0",
                        "hover:bg-surface-container-high/60 focus-visible:bg-surface-container-high/60 focus-visible:outline-none",
                      )}
                      key={row.id}
                      onClick={() => router.push(`${basePath}/${row.original.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`${basePath}/${row.original.id}`);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td className="px-4 py-3" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredCount > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span>{admin.tableRowsPerPage}</span>
                <select
                  className="rounded-md border border-hair bg-paper px-2 py-1.5 text-sm text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
                  onChange={(event) => {
                    table.setPageSize(Number(event.target.value));
                  }}
                  value={table.getState().pagination.pageSize}
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-3">
                <p className="text-body-sm text-on-surface-variant">{pageLabel}</p>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                    type="button"
                  >
                    {admin.tablePreviousPage}
                  </button>
                  <button
                    className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                    type="button"
                  >
                    {admin.tableNextPage}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
