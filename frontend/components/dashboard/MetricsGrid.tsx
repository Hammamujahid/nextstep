"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Check,
  Flag,
  FolderKanban,
  SquareCheckBig,
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import { fetchMetrics, type DashboardMetrics } from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";

export default function MetricsGrid() {
  const { active } = useDashboard();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchMetrics(active.id)
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  // SSE realtime untuk metrics & progress
  useEffect(() => {
    if (!active) return;
    const disconnect = connectWorkspaceEvents(active.id, (ev) => {
      if (ev.type === "goals_refresh" || ev.type === "task_toggled" || ev.type === "task_created" || ev.type === "goal_progress" || ev.type === "goal_created") {
        fetchMetrics(active.id)
          .then((data) => setMetrics(data))
          .catch(() => {});
      }
    });
    return () => disconnect();
  }, [active]);

  if (loading) {
    return (
      <section
        aria-label="Progress overview"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="animate-pulse">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-3 h-7 w-20 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  const goals = metrics?.goals ?? { total: 0, not_started: 0, in_progress: 0, completed: 0, archived: 0 };
  const tasks = metrics?.tasks ?? { total: 0, completed: 0, pending: 0, high_priority: 0, medium_priority: 0, low_priority: 0, not_started: 0, in_progress: 0, archived: 0 };
  const apps = metrics?.applications ?? { total: 0, wishlist: 0, applied: 0, interviewing: 0, offered: 0, rejected: 0 };
  const projects = metrics?.projects ?? { total: 0, not_started: 0, in_progress: 0, completed: 0, archived: 0 };

  const taskVelocity = tasks.total > 0 ? Math.round((tasks.completed * 100) / tasks.total) : 0;

  const items = [
    {
      label: "Goals In Progress",
      icon: Flag,
      iconBg: "bg-sky-100 text-sky-600",
      value: `${goals.in_progress} Active`,
      foot: goals.total === 0
        ? "No goals yet"
        : `${goals.completed} completed \u2022 ${goals.not_started} queued`,
      footTone: "text-slate-500",
    },
    {
      label: "Completed Tasks",
      icon: SquareCheckBig,
      iconBg: "bg-emerald-100 text-emerald-600",
      value: `${tasks.completed} / ${tasks.total}`,
      foot: `${taskVelocity}% completed`,
      footTone: "text-sky-600",
    },
    {
      label: "Applications",
      icon: Briefcase,
      iconBg: "bg-sky-100 text-sky-600",
      value: `${apps.total} Total`,
      foot: `${apps.interviewing} interviewing \u2022 ${apps.applied} applied`,
      footTone: "text-slate-500",
    },
    {
      label: "Active Projects",
      icon: FolderKanban,
      iconBg: "bg-sky-100 text-sky-600",
      value: `${projects.total} Builds`,
      foot: `${projects.completed} completed \u2022 ${projects.in_progress} active`,
      footTone: "text-slate-500",
    },
  ];

  return (
    <section
      aria-label="Progress overview"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((m) => (
        <div
          key={m.label}
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {m.label}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.iconBg}`}
            >
              <m.icon className="h-[18px] w-[18px]" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold leading-none tracking-tight text-slate-900">
              {m.value}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-slate-500">
              {m.label === "Goals In Progress" && goals.total > 0 ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className={m.footTone}>{m.foot}</span>
                </>
              ) : (
                <span className={m.footTone}>{m.foot}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
