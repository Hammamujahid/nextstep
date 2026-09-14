"use client";

import {
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  Check,
  CircleCheck,
  Clock,
  Flag,
  ListChecks,
} from "lucide-react";
import {
  GOAL_MILESTONES,
  GOAL_PROJECT_LINKS,
  NORTH_STAR_GOAL,
  type GoalMilestone,
} from "../../lib/dashboard";

function MilestoneIcon({ state }: { state: GoalMilestone["state"] }) {
  if (state === "complete") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="pulse-dot flex h-6 w-6 items-center justify-center rounded-full bg-sky-400 text-xs font-bold text-white">
        3
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-500">
      {state === "upcoming" ? "4" : "5"}
    </span>
  );
}

function MilestoneCard({ milestone }: { milestone: GoalMilestone }) {
  const current = milestone.state === "current";
  const dimmed = milestone.state === "upcoming" || milestone.state === "final";

  return (
    <div
      className={`flex flex-col justify-between rounded-xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        current
          ? "bg-sky-100/70 shadow-sm ring-1 ring-sky-200"
          : "bg-slate-50"
      } ${dimmed ? "opacity-85" : ""}`}
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <MilestoneIcon state={milestone.state} />
          <span
            className={`font-mono text-[11px] font-semibold ${
              milestone.state === "complete"
                ? "text-emerald-600"
                : current
                  ? "text-sky-600"
                  : "text-slate-400"
            }`}
          >
            {milestone.quarterLabel}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-slate-900">
          {milestone.title}
        </h4>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
          {milestone.detail}
        </p>
      </div>
      <div className="mt-4">
        {milestone.progress != null ? (
          <div>
            <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-sky-600">
              <span>{milestone.progress}% completed</span>
              <span>{milestone.progressDue}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
            <span>{milestone.footLeft}</span>
            {milestone.state === "complete" ? (
              <CircleCheck className="h-4 w-4 text-emerald-500" />
            ) : milestone.state === "final" ? (
              <Flag className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NorthStarCard() {
  const goal = NORTH_STAR_GOAL;

  return (
    <section
      aria-label="North star goal"
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-40 h-60 w-60 rounded-full bg-sky-50 blur-2xl"
      />

      <div className="relative mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
              North Star Objective
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              High Priority
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {goal.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-base">
            {goal.description}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-4 rounded-xl bg-slate-50 p-3 sm:items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[11px] text-slate-500">
                Target Date
              </span>
              <span className="block text-[15px] font-bold text-slate-900">
                {goal.targetDate}
              </span>
            </span>
          </div>
          <span aria-hidden="true" className="hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[11px] text-slate-500">Remaining</span>
              <span className="block text-[15px] font-bold text-slate-900">
                {goal.remaining}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Master Track Progress{" "}
            <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-500">
              {goal.stageLabel}
            </span>
          </p>
          <span className="text-[15px] font-bold text-sky-600">
            {goal.progress}% Completed
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 p-0.5">
          <div
            className="anim-grow-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-300"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="relative mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">
            Milestones Roadmap
          </h3>
          <span className="text-xs text-slate-500">
            3 of 5 Milestones Locked In
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5 md:gap-3">
          {GOAL_MILESTONES.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Integrated Portfolio Projects
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-sky-600">
            Manage Projects in Workspace
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {GOAL_PROJECT_LINKS.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 transition hover:bg-sky-50"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-lg font-bold text-sky-600">
                {p.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="truncate text-[13px] font-semibold text-slate-900">
                    {p.name}
                  </h5>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                      p.progressTone === "emerald"
                        ? "bg-white text-emerald-600"
                        : "bg-white text-sky-600"
                    }`}
                  >
                    {p.progress}% Done
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">{p.stack}</p>
                <p className="mt-1 flex items-center gap-3 font-mono text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {p.tasksLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {p.timeLabel}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
