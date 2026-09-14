"use client";

import {
  CalendarClock,
  CircleCheck,
  Timer,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { BoardTask } from "../../lib/dashboard";

function formatHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}`;
}

export default function TasksStats({ tasks }: { tasks: BoardTask[] }) {
  const open = tasks.filter((t) => t.lane !== "completed");
  const done = tasks.filter((t) => t.lane === "completed");
  const high = open.filter((t) => t.priority === "high");
  const todayCount = open.filter((t) => t.dueKey === "today").length;
  const focusMinutes = open.reduce((sum, t) => sum + t.estimateMinutes, 0);
  const velocity =
    tasks.length === 0
      ? 0
      : Math.round((done.length / tasks.length) * 100);

  const cards = [
    {
      label: "Due This Week",
      value: String(open.length),
      foot: (
        <>
          <TrendingUp className="h-3.5 w-3.5" /> {todayCount} scheduled today
        </>
      ),
      footCls: "text-sky-600",
      icon: CalendarClock,
      iconCls: "bg-sky-100 text-sky-600",
    },
    {
      label: "Completed",
      value: String(done.length),
      foot: (
        <>
          <CircleCheck className="h-3.5 w-3.5" /> {velocity}% completion velocity
        </>
      ),
      footCls: "text-emerald-600",
      icon: CircleCheck,
      iconCls: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "High Priority",
      value: String(high.length).padStart(2, "0"),
      foot: (
        <>
          <TriangleAlert className="h-3.5 w-3.5" /> Action required soon
        </>
      ),
      footCls: "text-red-600",
      icon: TriangleAlert,
      iconCls: "bg-red-100 text-red-600",
    },
    {
      label: "Focus Time Bank",
      value: `${formatHours(focusMinutes)}`,
      suffix: "hrs",
      foot: (
        <>
          <Timer className="h-3.5 w-3.5" /> Est. effort remaining
        </>
      ),
      footCls: "text-slate-500",
      icon: Timer,
      iconCls: "bg-slate-100 text-slate-500",
    },
  ];

  return (
    <section
      aria-label="Task statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {c.label}
            </p>
            <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-slate-900">
              {c.value}
              {c.suffix && (
                <span className="ml-1 text-sm font-medium text-slate-400">
                  {c.suffix}
                </span>
              )}
            </p>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[13px] font-medium ${c.footCls}`}
            >
              {c.foot}
            </p>
          </div>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.iconCls}`}
          >
            <c.icon className="h-6 w-6" />
          </span>
        </div>
      ))}
    </section>
  );
}
