"use client";

import type { ProjectItem } from "../../lib/dashboard";

const STAGE_BADGE: Record<ProjectItem["status"], string> = {
  polish: "bg-sky-100 text-sky-700",
  "in-progress": "bg-slate-100 text-sky-700",
  planning: "bg-slate-100 text-slate-500",
  completed: "bg-emerald-100 text-emerald-700",
};

const STAGE_LABEL: Record<ProjectItem["status"], string> = {
  polish: "Polish Stage",
  "in-progress": "In Progress",
  planning: "Planning",
  completed: "Completed",
};

export default function ProjectsTable({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No projects match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-4 py-3 font-semibold">
              Project
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Stage
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Progress
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Stack
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((p) => (
            <tr key={p.id} className="transition hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="max-w-64 truncate text-xs text-slate-500">
                  {p.tagline}
                </p>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STAGE_BADGE[p.status]}`}
                >
                  {STAGE_LABEL[p.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-sky-400"
                      style={{ width: `${p.progress}%` }}
                    />
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {p.progress}%
                  </span>
                </span>
              </td>
              <td className="max-w-56 truncate px-4 py-3 text-xs text-slate-500">
                {p.stack.join(", ") || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                {p.updatedLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
