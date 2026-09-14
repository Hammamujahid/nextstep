"use client";

import { ArrowDownUp, List, SquareKanban } from "lucide-react";

export type PipelineFilter =
  | "all"
  | "remote"
  | "onsite"
  | "interview"
  | "high";

export type PipelineView = "board" | "table";

type ApplicationsFilterBarProps = {
  filter: PipelineFilter;
  onFilterChange: (f: PipelineFilter) => void;
  view: PipelineView;
  onViewChange: (v: PipelineView) => void;
  total: number;
};

const CHIPS: { key: PipelineFilter; label: (n: number) => string }[] = [
  { key: "all", label: (n) => `All Roles (${n})` },
  { key: "remote", label: () => "Remote Only" },
  { key: "onsite", label: () => "Onsite / Hybrid" },
  { key: "interview", label: () => "Active Interview Stages" },
  { key: "high", label: () => "High Priority ($180k+)" },
];

export default function ApplicationsFilterBar({
  filter,
  onFilterChange,
  view,
  onViewChange,
  total,
}: ApplicationsFilterBarProps) {
  const viewBtn = (active: boolean) =>
    `flex items-center gap-1 rounded-md px-2.5 py-1 text-[13px] transition ${
      active
        ? "bg-sky-100 font-semibold text-sky-700 shadow-sm"
        : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => onFilterChange(c.key)}
            aria-pressed={filter === c.key}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition ${
              filter === c.key
                ? "bg-sky-100 font-semibold text-sky-700"
                : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {c.label(total)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Pipeline layout"
          className="flex items-center rounded-lg bg-slate-100 p-0.5"
        >
          <button
            role="tab"
            aria-selected={view === "board"}
            onClick={() => onViewChange("board")}
            className={viewBtn(view === "board")}
          >
            <SquareKanban className="h-4 w-4" /> Board
          </button>
          <button
            role="tab"
            aria-selected={view === "table"}
            onClick={() => onViewChange("table")}
            className={viewBtn(view === "table")}
          >
            <List className="h-4 w-4" /> Table
          </button>
        </div>
        <span aria-hidden="true" className="h-4 w-px bg-slate-200" />
        <span className="flex items-center gap-1 text-[13px] text-slate-500">
          <ArrowDownUp className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Recent Activity</span>
        </span>
      </div>
    </div>
  );
}
