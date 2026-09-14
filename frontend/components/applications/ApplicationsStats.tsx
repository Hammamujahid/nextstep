"use client";

import {
  ArrowUp,
  BadgeCheck,
  Hourglass,
  Package,
  Video,
} from "lucide-react";
import type { PipelineApplication } from "../../lib/dashboard";

export default function ApplicationsStats({
  apps,
}: {
  apps: PipelineApplication[];
}) {
  const interviews = apps.filter((a) => a.activeInterview).length;

  const cards = [
    {
      label: "Total Pipeline",
      value: "26",
      sub: (
        <>
          <ArrowUp className="h-3.5 w-3.5" /> +3 this wk
        </>
      ),
      subCls: "text-emerald-600",
      extra: "14 actively ongoing",
      icon: Package,
      iconCls: "bg-slate-100 text-sky-600",
    },
    {
      label: "Active Interviews",
      value: String(interviews),
      suffix: "rounds sched.",
      sub: <>Next: Tomorrow 10am</>,
      subCls: "text-sky-600 font-medium",
      extra: null,
      icon: Video,
      iconCls: "bg-sky-100 text-sky-600",
    },
    {
      label: "Under Review",
      value: "8",
      suffix: "teams",
      sub: <>Avg reply: 4.2 days</>,
      subCls: "text-slate-500",
      extra: null,
      icon: Hourglass,
      iconCls: "bg-slate-100 text-sky-600",
    },
    {
      label: "Offers Pending",
      value: "2",
      sub: <>Negotiation stage</>,
      subCls: "text-emerald-600 font-medium",
      extra: "$195k+",
      extraCls:
        "rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600",
      icon: BadgeCheck,
      iconCls: "bg-slate-100 text-emerald-600",
    },
  ];

  return (
    <section
      aria-label="Pipeline statistics"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
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
            <p className="mt-1 text-2xl font-bold leading-none tracking-tight text-slate-900 sm:text-3xl">
              {c.value}{" "}
              {c.suffix && (
                <span className="text-xs font-medium text-slate-500">
                  {c.suffix}
                </span>
              )}
            </p>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[13px] ${c.subCls}`}
            >
              {c.sub}
            </p>
            {c.extra && (
              <p className="mt-0.5 block text-[13px] text-slate-500">
                {c.extraCls ? (
                  <span className={c.extraCls}>{c.extra}</span>
                ) : (
                  c.extra
                )}
              </p>
            )}
          </div>
          <span
            className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex ${c.iconCls}`}
          >
            <c.icon className="h-[22px] w-[22px]" />
          </span>
        </div>
      ))}
    </section>
  );
}
