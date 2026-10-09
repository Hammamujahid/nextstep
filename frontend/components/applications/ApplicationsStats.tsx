"use client";

import {
  Briefcase,
  Hourglass,
  Video,
  BadgeCheck,
} from "lucide-react";
import type { ApiApplication } from "../../lib/dashboardApi";

export default function ApplicationsStats({
  apps,
}: {
  apps: ApiApplication[];
}) {
  const interviewing = apps.filter((a) => a.status === "interviewing").length;
  const underReview = apps.filter((a) => a.status === "under_review").length;
  const offered = apps.filter((a) => a.status === "offered").length;

  const cards = [
    {
      label: "Total Applications",
      value: String(apps.length),
      sub: "Across all stages",
      subCls: "text-slate-500",
      icon: Briefcase,
      iconCls: "bg-slate-100 text-sky-600",
    },
    {
      label: "Interviewing",
      value: String(interviewing),
      sub: "Active interview stages",
      subCls: "text-sky-600 font-medium",
      icon: Video,
      iconCls: "bg-sky-100 text-sky-600",
    },
    {
      label: "Under Review",
      value: String(underReview),
      sub: "Waiting for reply",
      subCls: "text-slate-500",
      icon: Hourglass,
      iconCls: "bg-amber-100 text-amber-600",
    },
    {
      label: "Offered",
      value: String(offered),
      sub: "Negotiation stage",
      subCls: "text-emerald-600 font-medium",
      icon: BadgeCheck,
      iconCls: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <section
      aria-label="Application statistics"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center justify-between clay p-4 transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {c.label}
            </p>
            <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-slate-900">
              {c.value}
            </p>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[13px] ${c.subCls}`}
            >
              {c.sub}
            </p>
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
