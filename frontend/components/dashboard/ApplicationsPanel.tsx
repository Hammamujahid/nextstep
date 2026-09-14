"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays } from "lucide-react";
import { DASHBOARD_APPLICATIONS } from "../../lib/dashboard";

const STATUS_STYLES: Record<string, string> = {
  interview: "bg-sky-100 text-sky-700",
  review: "bg-sky-100 text-sky-700",
  final: "bg-emerald-100 text-emerald-700",
  submitted: "bg-slate-100 text-slate-500",
};

const NOTE_STYLES: Record<string, string> = {
  sky: "font-medium text-sky-600",
  slate: "text-slate-500",
  emerald: "font-semibold text-emerald-600",
};

export default function ApplicationsPanel() {
  return (
    <section aria-label="Job applications">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Job Applications
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          6 Active
        </span>
      </div>

      <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {DASHBOARD_APPLICATIONS.map((app) => (
          <div
            key={app.id}
            className="p-4 transition hover:bg-slate-50/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                  {app.company.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {app.company}
                  </p>
                  <p className="truncate text-[13px] text-slate-500">
                    {app.role}
                  </p>
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[app.statusTone]}`}
              >
                {app.statusTone === "interview" && (
                  <CalendarDays className="h-3 w-3" />
                )}
                {app.status}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between pl-12 text-xs text-slate-500">
              <span>{app.applied}</span>
              <span className={NOTE_STYLES[app.noteTone]}>{app.note}</span>
            </div>
          </div>
        ))}
        <div className="bg-slate-50 p-2">
          <Link
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group flex items-center justify-center gap-1 rounded-xl py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100"
          >
            View All 26 Applications
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
