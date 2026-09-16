"use client";

import Link from "next/link";
import { ChevronRight, Layers, Terminal, Workflow } from "lucide-react";
import type { DashboardProject, DashboardTask } from "../../lib/dashboard";

type ProjectsPanelProps = {
  tasks?: DashboardTask[];
  projects?: DashboardProject[];
};

const PROJECT_STATUS_RANK: Record<DashboardProject["status"], number> = {
  completed: 4,
  in_progress: 3,
  not_started: 2,
  archived: 1,
};

export default function ProjectsPanel({ tasks = [], projects = [] }: ProjectsPanelProps) {
  const raw = projects ?? [];
  const list = [...raw].sort((a, b) => {
    const ra = PROJECT_STATUS_RANK[a.status];
    const rb = PROJECT_STATUS_RANK[b.status];
    if (ra !== rb) return rb - ra;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  return (
    <section aria-label="Active projects">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Active Projects
          </h2>
        </div>
        <Link
          href="/dashboard/projects"
          className="group flex items-center text-[13px] font-semibold text-sky-600 hover:text-sky-700"
        >
          All Projects ({list.length})
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No projects yet. Create your first project to get started.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((p, i) => {
          const related = tasks.filter((t) => t.projectId === p.id);
          const tasksDone = related.filter((t) => t.status === "completed").length;
          const tasksTotal = related.length > 0 ? related.length : p.tasksTotal;
          const done = related.length > 0 ? tasksDone : p.tasksDone;
          const total = tasksTotal;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105 ${
                      i === 0
                        ? "bg-sky-100 text-sky-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {i === 0 ? (
                      <Layers className="h-5 w-5" />
                    ) : (
                      <Workflow className="h-5 w-5" />
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      p.stageTone === "polish"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.stage}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-slate-900 transition group-hover:text-sky-600">
                  {p.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
                  {p.description}
                </p>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {done} / {total} Tasks
                  </span>
                  <span
                    className={`font-bold ${i === 0 ? "text-sky-600" : "text-emerald-600"}`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      i === 0
                        ? "bg-gradient-to-r from-sky-400 to-sky-500"
                        : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
