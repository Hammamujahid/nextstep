"use client";

import { LayoutGrid, Search, Table2 } from "lucide-react";
import { PROJECT_STATUS_META, type ProjectStatus } from "../../lib/dashboard";

export type ProjectStatusFilter = ProjectStatus | "all";
export type ProjectsViewMode = "grid" | "table";

type ProjectsFilterBarProps = {
  status: ProjectStatusFilter;
  onStatusChange: (s: ProjectStatusFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  mode: ProjectsViewMode;
  onModeChange: (m: ProjectsViewMode) => void;
  counts: Record<ProjectStatusFilter, number>;
};

export default function ProjectsFilterBar({
  status,
  onStatusChange,
  query,
  onQueryChange,
  mode,
  onModeChange,
  counts,
}: ProjectsFilterBarProps) {
  const modeBtn = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-md transition ${
      active
        ? "bg-white text-sky-600 shadow-sm"
        : "text-slate-400 hover:text-slate-900"
    }`;

  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {PROJECT_STATUS_META.map((s) => (
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
            placeholder="Filter by tech stack or name..."
            aria-label="Filter projects"
            className="h-9 w-full rounded-lg bg-slate-100 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div
          role="tablist"
          aria-label="Projects layout"
          className="flex items-center rounded-lg bg-slate-100 p-0.5"
        >
          <button
            role="tab"
            aria-selected={mode === "grid"}
            aria-label="Grid view"
            onClick={() => onModeChange("grid")}
            className={modeBtn(mode === "grid")}
          >
            <LayoutGrid className="h-[18px] w-[18px]" />
          </button>
          <button
            role="tab"
            aria-selected={mode === "table"}
            aria-label="Table view"
            onClick={() => onModeChange("table")}
            className={modeBtn(mode === "table")}
          >
            <Table2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
