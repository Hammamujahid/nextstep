"use client";

import { Search } from "lucide-react";

export type ProjectStatusFilter = "all" | "not_started" | "in_progress" | "completed" | "archived";

type ProjectsFilterBarProps = {
  status: ProjectStatusFilter;
  onStatusChange: (s: ProjectStatusFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  counts: Record<ProjectStatusFilter, number>;
};

const STATUS_FILTERS: { key: ProjectStatusFilter; label: (n: number) => string }[] = [
  { key: "all", label: (n) => `All (${n})` },
  { key: "not_started", label: (n) => `Not Started (${n})` },
  { key: "in_progress", label: (n) => `In Progress (${n})` },
  { key: "completed", label: (n) => `Completed (${n})` },
  { key: "archived", label: (n) => `Archived (${n})` },
];

export default function ProjectsFilterBar({
  status,
  onStatusChange,
  query,
  onQueryChange,
  counts,
}: ProjectsFilterBarProps) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            aria-pressed={status === s.key}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] transition ${
              status === s.key
                ? "bg-slate-800 font-semibold text-white shadow-sm"
                : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {s.label(counts[s.key] ?? 0)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-full md:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by name or description..."
            aria-label="Filter projects"
            className="h-9 w-full rounded-lg bg-slate-100 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>
    </div>
  );
}
