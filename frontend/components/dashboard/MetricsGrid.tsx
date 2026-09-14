"use client";

import {
  Briefcase,
  Check,
  Flag,
  SquareCheckBig,
  FolderKanban,
} from "lucide-react";

const METRICS = [
  {
    label: "Goals In Progress",
    icon: Flag,
    iconBg: "bg-sky-100 text-sky-600",
    value: "3 Active",
    foot: (
      <>
        <span className="flex items-center font-semibold text-emerald-600">
          <Check className="h-3.5 w-3.5" /> 1 primary
        </span>
        <span aria-hidden="true">•</span> 2 skill tracks
      </>
    ),
  },
  {
    label: "Completed Tasks",
    icon: SquareCheckBig,
    iconBg: "bg-emerald-100 text-emerald-600",
    value: "48 / 64",
    foot: (
      <>
        <span className="font-semibold text-sky-600">75% velocity</span> this
        month
      </>
    ),
  },
  {
    label: "Applications",
    icon: Briefcase,
    iconBg: "bg-sky-100 text-sky-600",
    value: "26 Total",
    foot: (
      <>
        <span className="font-semibold text-sky-600">4 interviews</span>
        <span aria-hidden="true">•</span> 8 under review
      </>
    ),
  },
  {
    label: "Active Projects",
    icon: FolderKanban,
    iconBg: "bg-sky-100 text-sky-600",
    value: "4 Builds",
    foot: (
      <>
        <span className="font-semibold text-emerald-600">
          2 portfolio-ready
        </span>{" "}
        demos
      </>
    ),
  },
];

export default function MetricsGrid() {
  return (
    <section
      aria-label="Progress overview"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {METRICS.map((m) => (
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
              {m.foot}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
