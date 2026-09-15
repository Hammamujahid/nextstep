"use client";

import { CirclePlus, SlidersHorizontal } from "lucide-react";

type GoalsHeaderProps = {
  onNewGoal: () => void;
  onToggleFilters: () => void;
  filtersVisible: boolean;
};

export default function GoalsHeader({
  onNewGoal,
  onToggleFilters,
  filtersVisible,
}: GoalsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Strategic Roadmapping
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="font-medium normal-case tracking-normal text-slate-500">
            Q2-Q3 2025 Cycle
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Career Goals
        </h1>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        <button
          onClick={onToggleFilters}
          aria-pressed={filtersVisible}
          className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium shadow-sm transition ${
            filtersVisible
              ? "bg-sky-100 text-sky-700"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="h-[18px] w-[18px] text-slate-400" />
          Filter Tracks
        </button>
        <button
          onClick={onNewGoal}
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md active:translate-y-0"
        >
          <CirclePlus className="h-[18px] w-[18px]" />
          New Goal
        </button>
      </div>
    </div>
  );
}
