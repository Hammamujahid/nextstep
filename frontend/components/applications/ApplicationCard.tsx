"use client";

import {
  BadgeCheck,
  Calculator,
  Check,
  Code2,
  EllipsisVertical,
  Handshake,
  MailOpen,
  Timer,
  Users,
} from "lucide-react";
import type { PipelineApplication } from "../../lib/dashboard";

const FOOTER_TONE: Record<PipelineApplication["footerMainTone"], string> = {
  sky: "text-sky-600 font-medium",
  slate: "text-slate-500",
  emerald: "text-emerald-600 font-medium",
  red: "text-red-600 font-semibold",
};

type ApplicationCardProps = {
  app: PipelineApplication;
  ring?: "sky" | "emerald" | null;
};

export default function ApplicationCard({ app, ring }: ApplicationCardProps) {
  return (
    <article
      className={`group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        ring === "sky"
          ? "ring-1 ring-sky-300"
          : ring === "emerald"
            ? "ring-2 ring-emerald-300"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-sky-600">
            {app.company.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              {app.company}
            </p>
            <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-sky-600">
              {app.role}
            </h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {app.location}
        </span>
      </div>

      {app.description && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {app.description}
        </p>
      )}

      {app.interview && (
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="flex items-center gap-1 text-[13px] font-semibold text-slate-900">
            <Code2 className="h-4 w-4 text-sky-500" />
            {app.interview.title}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-sky-600">
            {app.interview.datetime}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{app.interview.sub}</p>
        </div>
      )}

      {app.assignment && (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-[13px]">
          <span className="flex items-center gap-1 font-medium text-slate-900">
            <Timer className="h-[15px] w-[15px] text-red-500" />
            {app.assignment.label}
          </span>
          <span className="text-xs text-slate-500">{app.assignment.right}</span>
        </div>
      )}

      {app.onsite && (
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="flex items-center gap-1 text-[13px] font-semibold text-slate-900">
            <Users className="h-4 w-4 text-emerald-600" />
            {app.onsite.title}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-900">
            {app.onsite.datetime}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{app.onsite.sub}</p>
        </div>
      )}

      {app.offer ? (
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-slate-900">
            <span className="text-[11px] font-semibold uppercase text-slate-500">
              Current Offer
            </span>
            <span className="text-base font-bold text-emerald-600">
              {app.offer.amount}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[13px] text-slate-500">
            <span>{app.offer.equity}</span>
            <span>{app.offer.signon}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-500">
            <span>Decision Deadline:</span>
            <span className="font-semibold text-red-600">
              {app.offer.deadline}
            </span>
          </div>
        </div>
      ) : (
        app.salary && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
            <span>{app.salary}</span>
            <span>{app.salaryMeta}</span>
          </div>
        )
      )}

      {app.offer ? (
        <div className="flex items-center justify-between pt-1">
          <button className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-100 px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200">
            <Calculator className="h-[15px] w-[15px]" /> Comp Model
          </button>
          <button className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-[13px] font-semibold text-white transition hover:bg-emerald-600">
            <Handshake className="h-[15px] w-[15px]" /> Counter
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span className={`flex items-center gap-1 ${FOOTER_TONE[app.footerMainTone]}`}>
            {app.footerMainTone === "sky" ? (
              <MailOpen className="h-[15px] w-[15px]" />
            ) : app.footerMainTone === "emerald" ? (
              <BadgeCheck className="h-[15px] w-[15px]" />
            ) : app.footerMainTone === "red" ? (
              <Timer className="h-[15px] w-[15px]" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {app.footerMain}
          </span>
          {app.footerRight ? (
            <span className={app.footerRight === "Prep Room" || app.footerRight === "Notes Ready" || app.footerRight === "Upload PR" ? "font-semibold text-sky-600" : ""}>
              {app.footerRight}
            </span>
          ) : (
            <button
              aria-label={`More options for ${app.company}`}
              className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
