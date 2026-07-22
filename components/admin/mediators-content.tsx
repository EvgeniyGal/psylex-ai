"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { formatCredentials, localizeRole } from "@/lib/credentials";
import { cn } from "@/lib/utils";

type MediatorRow = {
  id: string;
  login: string;
  password: string;
  role: string;
  title: string;
  description: string;
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

export function MediatorsContent({ mediators }: { mediators: MediatorRow[] }) {
  const { admin } = useLocale();
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const onCopyCredentials = async (mediator: MediatorRow) => {
    const text = formatCredentials({
      roleLabel: admin.roleLabel,
      loginLabel: admin.loginLabel,
      passwordLabel: admin.passwordLabel,
      role: localizeRole(admin.roles, mediator.role),
      login: mediator.login,
      password: mediator.password,
    });
    await navigator.clipboard.writeText(text);
    toast.success(admin.copyCredentials);
  };

  const columns = useMemo<ColumnDef<MediatorRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: admin.titleLabel,
        cell: ({ getValue }) => (
          <span className="font-display text-body-md font-semibold text-on-surface">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: admin.descriptionLabel,
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate text-body-sm text-on-surface-variant">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        id: "actions",
        header: admin.tableActions,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            onClick={(event) => {
              event.stopPropagation();
              void onCopyCredentials(row.original);
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            {admin.copyCredentials}
          </button>
        ),
      },
    ],
    [admin],
  );

  const table = useReactTable({
    data: mediators,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) return true;
      const haystack = [row.original.title, row.original.description, row.original.login]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    },
  });

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
          <h3 className="mb-2 font-display text-headline-lg text-on-surface">{admin.mediatorsTitle}</h3>
          <p className="max-w-xl text-on-surface-variant">{admin.mediatorsSubtitle}</p>
        </div>
        <Link
          className="btn-primary flex items-center gap-2 px-8 py-3 active:translate-y-px"
          href="/admin/mediators/new"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_add
          </span>
          {admin.addMediator}
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
              className="w-full rounded-md border border-hair bg-paper py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              placeholder={admin.searchPlaceholder}
              type="search"
              value={globalFilter}
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
                      onClick={() => router.push(`/admin/mediators/${row.original.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/admin/mediators/${row.original.id}`);
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
