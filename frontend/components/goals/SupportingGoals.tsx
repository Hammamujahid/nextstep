"use client";

import {
  Briefcase,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Newspaper,
  Server,
} from "lucide-react";
import type { SupportingGoal } from "../../lib/dashboard";

const BADGE_STYLES: Record<SupportingGoal["badgeTone"], string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-100 text-slate-500",
  sky: "bg-sky-100 text-sky-700",
};

const PROGRESS_BAR: Record<SupportingGoal["progressTone"], string> = {
  emerald: "bg-emerald-400",
  sky: "bg-gradient-to-r from-sky-400 to-sky-500",
};

const ICONS = {
  server: Server,
  article: Newspaper,
  briefcase: Briefcase,
} as const;

export type GoalSort = "progress" | "deadline" | "recent";

type SupportingGoalsProps = {
  goals: SupportingGoal[];
  sort: GoalSort;
  onSortChange: (s: GoalSort) => void;
  onToggleChecklist: (goalId: number, itemId: number) => void;
};

export default function SupportingGoals({
  goals,
  sort,
  onSortChange,
  onToggleChecklist,
}: SupportingGoalsProps) {
  return (
    <section aria-label="Supporting goals">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Supporting Goals and Competency Tracks
          </h3>
          <p className="text-sm text-slate-500">
            Concurrent pillars backing the North Star Fullstack career evolution.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[13px] text-slate-500">Sort by:</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as GoalSort)}
              aria-label="Sort supporting goals"
              className="cursor-pointer appearance-none rounded-lg bg-white py-1.5 pl-2.5 pr-8 text-[13px] font-medium text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-100"
            >
              <option value="progress">Highest Completion</option>
              <option value="deadline">Nearest Deadline</option>
              <option value="recent">Recently Updated</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {goals.map((goal) => {
          const Icon = ICONS[goal.icon];
          return (
            <article
              key={goal.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${BADGE_STYLES[goal.badgeTone]}`}
                  >
                    {goal.badge}
                  </span>
                </div>

                <h4 className="mb-1 text-[15px] font-bold text-slate-900">
                  {goal.title}
                </h4>
                <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
                  {goal.description}
                </p>

                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">{goal.progressLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${PROGRESS_BAR[goal.progressTone]}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Key Results Checklist
                  </span>
                  {goal.signal && (
                    <div className="mb-2 flex flex-col gap-1.5 rounded-lg bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-slate-900">
                          {goal.signal.left}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-emerald-600">
                          {goal.signal.right}
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <CalendarClock className="h-4 w-4 text-sky-500" />
                        {goal.signal.note}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {goal.checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-2.5 ${
                          item.locked ? "cursor-default" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          disabled={item.locked}
                          onChange={() => onToggleChecklist(goal.id, item.id)}
                          aria-label={item.label}
                          className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-sky-500 disabled:cursor-default"
                        />
                        <span
                          className={`text-[13px] ${
                            item.done
                              ? "text-slate-400 line-through opacity-70"
                              : "text-slate-900"
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-b-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-[15px] w-[15px]" />
                    {goal.tasksLabel}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-[15px] w-[15px]" />
                    {goal.dateLabel}
                  </span>
                </p>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-sky-600">
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
