"use client";

import {
  CalendarClock,
  CircleCheck,
  Clock,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { BoardTask } from "../../lib/dashboard";

function isDueThisWeek(t: BoardTask): boolean {
  if (t.lane === "completed") return false;
  if (t.dueDateISO) {
    const due = new Date(t.dueDateISO);
    if (Number.isNaN(due.getTime())) return false;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return due >= start && due <= end;
  }
  // fallback untuk task tanpa ISO mentah: hanya yang jelas-jelas berlabel due
  return t.dueLabel !== "No due date" && (t.dueKey === "today" || t.dueKey === "week");
}

export default function TasksStats({ tasks }: { tasks: BoardTask[] }) {
  const open = tasks.filter((t) => t.lane !== "completed");
  const done = tasks.filter((t) => t.lane === "completed");
  const high = open.filter((t) => t.priority === "high");
  const todayCount = open.filter((t) => t.dueKey === "today").length;
  const dueThisWeek = tasks.filter(isDueThisWeek).length;
  const notStarted = tasks.filter((t) => t.lane === "upcoming" || t.lane === "overdue").length;
  const velocity =
    tasks.length === 0
      ? 0
      : Math.round((done.length / tasks.length) * 100);

  const cards = [
    {
      label: "Due This Week",
      value: String(dueThisWeek),
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
      value: String(high.length),
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
      label: "Not Started",
      value: String(notStarted),
      foot: (
        <>
          <Clock className="h-3.5 w-3.5" /> Queued to start
        </>
      ),
      footCls: "text-slate-500",
      icon: Clock,
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
