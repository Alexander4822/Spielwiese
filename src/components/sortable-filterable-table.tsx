"use client";

import { useMemo, useState } from "react";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => string | number | JSX.Element;
};

type Props<T extends Record<string, string | number>> = {
  title: string;
  rows: T[];
  columns: Column<T>[];
};

export function SortableFilterableTable<T extends Record<string, string | number>>({
  title,
  rows,
  columns,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof T>(columns[0].key);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (!normalizedQuery) return true;
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(normalizedQuery),
      );
    });

    return filtered.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === "number" && typeof right === "number") {
        return sortDirection === "asc" ? left - right : right - left;
      }
      const compare = String(left).localeCompare(String(right));
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [query, rows, sortKey, sortDirection]);

  const onSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Suchen / Filtern..."
          className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm"
          aria-label={`${title} search`}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((column) => (
                <th key={String(column.key)} className="px-3 py-2">
                  <button
                    className="font-semibold"
                    onClick={() => onSort(column.key)}
                    type="button"
                  >
                    {column.label}
                    {sortKey === column.key ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((row, index) => (
              <tr key={index} className="border-b border-slate-100">
                {columns.map((column) => {
                  const rawValue = row[column.key];
                  return (
                    <td key={String(column.key)} className="px-3 py-2">
                      {column.render ? column.render(rawValue, row) : String(rawValue)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
