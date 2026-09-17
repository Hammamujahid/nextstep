"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Target } from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import {
  fetchPrimaryGoal,
  formatStatus,
  type PrimaryGoal,
} from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";

export default function PrimaryGoalCard() {
  const { active } = useDashboard();
  const [goal, setGoal] = useState<PrimaryGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeId = active?.id;

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    fetchPrimaryGoal(activeId)
      .then((data) => {
        if (!cancelled) {
          setGoal(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // SSE realtime untuk progress bar
  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (ev.type === "goal_progress" && ev.data) {
        const updated = ev.data as PrimaryGoal;
        setGoal((prev) => (prev && prev.id === (updated as any).id ? { ...prev, ...(updated as any) } : prev));
      } else if (ev.type === "goals_refresh" || ev.type === "task_toggled" || ev.type === "task_updated" || ev.type === "goal_created") {
        fetchPrimaryGoal(activeId)
          .then((data) => setGoal(data))
          .catch(() => {});
      }
    });
    return () => disconnect();
  }, [activeId]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="animate-pulse">
          <div className="h-5 w-24 rounded-full bg-slate-100" />
          <div className="mt-3 h-7 w-64 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-full max-w-xl rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <p className="text-sm font-medium text-red-600">Failed to load goal</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Target className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-base font-bold text-slate-900">No goals yet</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
          Create your first career goal to start tracking progress.
        </p>
        <Link
          href="/dashboard/goals"
          className="mt-4 inline-flex items-center gap-1 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Create Goal
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const requirementsLabel =
    goal.total_requirements > 0
      ? `${goal.completed_requirements}/${goal.total_requirements} requirements met`
      : "No linked projects or tasks";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-500 hover:shadow-[0_16px_40px_-16px_rgba(2,132,199,0.3)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl"
      />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
            {formatStatus(goal.status)}
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {goal.title}
          </h2>
          {goal.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-base">
              {goal.description}
            </p>
          )}
          {goal.total_requirements > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {goal.completed_projects}/{goal.total_projects} projects
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {goal.completed_tasks}/{goal.total_tasks} tasks
              </span>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Progress</span>
            <span className="font-bold text-sky-600">{goal.progress}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="anim-grow-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <div className="mt-2.5 text-xs text-slate-500">
            <span>{requirementsLabel}</span>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              href="/dashboard/goals"
              className="group inline-flex items-center gap-0.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Details
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
