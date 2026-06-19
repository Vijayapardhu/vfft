"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  emptyTitle?: string;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  error,
  onRetry,
  onRowClick,
  pageSize = 10,
  searchable,
  searchKeys,
  emptyTitle = "No data found",
  emptyMessage = "There are no items to display.",
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search || !searchKeys) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = (item as Record<string, unknown>)[key as string];
        return String(val ?? "").toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    setPage(0);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load data." onRetry={onRetry} />;
  }

  return (
    <div>
      {searchable && (
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={Inbox} title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border-4 border-ink shadow-brutal-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-4 border-ink bg-vyellow">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-sm font-bold uppercase tracking-wide",
                        col.sortable && "cursor-pointer select-none",
                      )}
                      onClick={() => col.sortable && toggleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {col.sortable && (
                          <>
                            {sortKey === col.key ? (
                              sortDir === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </>
                        )}
                      </span>
                    </th>
                  ))}
                  {actions && (
                    <th className="px-4 py-3 text-sm font-bold uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.map((item, i) => (
                  <tr
                    key={(item as Record<string, unknown>).id as string ?? i}
                    className={cn(
                      "border-b-2 border-ink/10 transition-colors last:border-0",
                      onRowClick && "cursor-pointer hover:bg-vyellow/30",
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm font-medium">
                        {col.render
                          ? col.render(item)
                          : (item as Record<string, unknown>)[col.key] != null
                            ? String((item as Record<string, unknown>)[col.key])
                            : "—"}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="cream"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm font-bold">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="cream"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
