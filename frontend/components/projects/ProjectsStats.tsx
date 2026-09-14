"use client";

import { ListChecks, Rocket, Terminal, TrendingUp, BadgeCheck } from "lucide-react";
import type { ProjectItem } from "../../lib/dashboard";

export default function ProjectsStats({ projects }: { projects: ProjectItem[] }) {
  const polishCount = projects.filter((p) => p.status === "polish").length;
  const openTasks = projects.reduce(
    (sum, p) => sum + Math.max(0, 14 - Math.round((p.progress / 100) * 14)),
    0
  );

  const cards = [
    {
      label: "Velocity",
      value: "28 commits",
      foot: (
        <>
          <TrendingUp className="h-3.5 w-3.5" /> +14% this sprint
        </>
      ),
      footCls: "text-emerald-600",
      icon: Terminal,
      iconCls: "bg-slate-100 text-sky-600",
    },
    {
      label: "Review Ready",
      value: `${polishCount} Build${polishCount === 1 ? "" : "s"}`,
      foot: <>Polish stage</>,
      footCls: "text-sky-600",
      icon: BadgeCheck,
      iconCls: "bg-sky-100 text-sky-600",
    },
    {
      label: "Open Tasks",
      value: `${openTasks} Items`,
      foot: <>4 blockers tagged</>,
      footCls: "text-slate-500",
      icon: ListChecks,
      iconCls: "bg-slate-100 text-slate-500",
    },
    {
      label: "Live Deployments",
      value: "2 Active",
      foot: (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 99.9%
          uptime
        </>
      ),
      footCls: "text-emerald-600",
      icon: Rocket,
      iconCls: "bg-slate-100 text-emerald-600",
    },
  ];

  return (
    <section
      aria-label="Project statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {c.label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {c.value}
            </p>
            <p
              className={`mt-0.5 flex items-center gap-1 font-mono text-xs ${c.footCls}`}
            >
              {c.foot}
            </p>
          </div>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.iconCls}`}
          >
            <c.icon className="h-5 w-5" />
          </span>
        </div>
      ))}
    </section>
  );
}
