"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import type { DueKey } from "../../lib/dashboard";

export type PriorityFilter = "all" | "high" | "medium" | "low";
export type DateFilter = "all" | DueKey;

type TasksFilterBarProps = {
  priority: PriorityFilter;
  onPriorityChange: (v: PriorityFilter) => void;
  date: DateFilter;
  onDateChange: (v: DateFilter) => void;
  onReset: () => void;
};

const PRIORITIES: { key: PriorityFilter; label: string; dot?: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High", dot: "bg-red-500" },
  { key: "medium", label: "Medium", dot: "bg-sky-400" },
  { key: "low", label: "Low", dot: "bg-slate-300" },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "Date: All active" },
  { value: "today", label: "Due Today" },
  { value: "week", label: "Due This Week" },
  { value: "overdue", label: "Overdue only" },
];

export default function TasksFilterBar({
  priority,
  onPriorityChange,
  date,
  onDateChange,
  onReset,
}: TasksFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Filter Priority:</span>
        {PRIORITIES.map((p) => (
          <button
            key={p.key}
            onClick={() => onPriorityChange(p.key)}
            aria-pressed={priority === p.key}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] transition ${
              priority === p.key
                ? "bg-slate-800 font-semibold text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            {p.dot && <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />}
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={date}
            onChange={(e) => onDateChange(e.target.value as DateFilter)}
            aria-label="Filter by due date"
            className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-8 text-[13px] font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <button
          onClick={onReset}
          title="Clear filters"
          aria-label="Clear filters"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <RotateCcw className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
