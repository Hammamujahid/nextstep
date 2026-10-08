"use client";

import { ArrowDownUp, List, SquareKanban } from "lucide-react";
import type { ApiApplication, ApplicationStatus } from "../../lib/dashboardApi";

export type ApplicationStatusFilter = "all" | ApplicationStatus;

export type ApplicationsViewMode = "board" | "table";

type ApplicationsFilterBarProps = {
  filter: ApplicationStatusFilter;
  onFilterChange: (f: ApplicationStatusFilter) => void;
  view: ApplicationsViewMode;
  onViewChange: (v: ApplicationsViewMode) => void;
  apps: ApiApplication[];
};

const STATUS_CHIPS: { key: ApplicationStatusFilter; label: string }[] = [
  { key: "all", label: "All Roles" },
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "under_review", label: "Under Review" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offered", label: "Offered" },
  { key: "rejected", label: "Rejected" },
];

export default function ApplicationsFilterBar({
  filter,
  onFilterChange,
  view,
  onViewChange,
  apps,
}: ApplicationsFilterBarProps) {
  const countFor = (s: ApplicationStatusFilter) =>
    s === "all" ? apps.length : apps.filter((a) => a.status === s).length;

  const viewBtn = (active: boolean) =>
    `flex items-center gap-1 rounded-md px-2.5 py-1 text-[13px] transition ${
      active
        ? "bg-indigo-100 font-semibold text-indigo-700 shadow-sm"
        : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 clay p-2.5 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => onFilterChange(c.key)}
            aria-pressed={filter === c.key}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition ${
              filter === c.key
                ? "bg-indigo-100 font-semibold text-indigo-700"
                : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {c.label} ({countFor(c.key)})
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
