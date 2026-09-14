"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

type ApplicationsHeaderProps = {
  onAdd: () => void;
  onToggleFilters: () => void;
  filtersVisible: boolean;
};

export default function ApplicationsHeader({
  onAdd,
  onToggleFilters,
  filtersVisible,
}: ApplicationsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Career Studio
          <span aria-hidden="true" className="text-slate-300">
            •
          </span>
          <span className="font-medium normal-case tracking-normal text-slate-500">
            Pipeline Cycle Q2
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Job Applications and Pipeline
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500 sm:text-base">
          Track interview trajectories, prep items, and salary negotiations in
          one serene workspace.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          onClick={onToggleFilters}
          aria-pressed={filtersVisible}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm transition ${
            filtersVisible
              ? "bg-sky-100 text-sky-700"
              : "bg-white text-slate-700 hover:bg-slate-100"
          } border border-slate-200`}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
          Filter Pipeline
        </button>
        <button
          onClick={onAdd}
          className="btn-shine inline-flex h-10 items-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add Application
        </button>
      </div>
    </div>
  );
}
