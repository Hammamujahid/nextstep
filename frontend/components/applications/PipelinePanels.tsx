"use client";

import { useState } from "react";
import { Lightbulb, SlidersHorizontal } from "lucide-react";
import {
  COMP_ROWS,
  FUNNEL_STAGES,
  PIPELINE_ACTIONS,
} from "../../lib/dashboard";

export function WeeklyActions() {
  const [doneIds, setDoneIds] = useState<number[]>(() =>
    PIPELINE_ACTIONS.filter((a) => a.done).map((a) => a.id)
  );

  function toggle(id: number) {
    setDoneIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">
            Weekly Action Items
          </h2>
          <span className="text-xs font-semibold text-sky-600">
            4 Due This Week
          </span>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          Methodical daily checklist to keep momentum calm and consistent.
        </p>
        <div className="space-y-2">
          {PIPELINE_ACTIONS.map((a) => {
            const done = doneIds.includes(a.id);
            return (
              <label
                key={a.id}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-slate-50 p-2.5 transition hover:bg-sky-50"
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(a.id)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded accent-sky-500"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[13px] font-medium ${
                      done ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {a.title}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {a.detail}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <button className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200">
        View All 12 Checklist Tasks
      </button>
    </div>
  );
}

export function FunnelPanel() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">
            Target Velocity and Funnel
          </h2>
          <span className="text-xs font-semibold text-emerald-600">
            Healthy 38% Pass Rate
          </span>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          Real-time stage conversions compared to your target benchmarks.
        </p>
        <div className="space-y-3">
          {FUNNEL_STAGES.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-700">{s.label}</span>
                <span className={`font-semibold ${s.valueTone}`}>
                  {s.value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${s.bar}`}
                  style={{ width: `${s.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
          <Lightbulb className="h-5 w-5 shrink-0 text-sky-500" />
          <p className="text-[13px] text-slate-700">
            <span className="font-semibold">Insight:</span> System architecture
            prep improved your round-2 pass rate by 18%.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Updated: 30 mins ago</span>
        <span className="font-semibold text-sky-600">Funnel Report →</span>
      </div>
    </div>
  );
}

export function CompBenchmark() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">
            Quick Compensation Benchmark
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            L5 / Staff
          </span>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          Based on your current tech stack (TypeScript, Go, React,
          Distributed).
        </p>
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">
              Median Base in Pipeline
            </span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              $192,500
            </span>
          </div>
          <span aria-hidden="true" className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">
              Top Offer in Range
            </span>
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              $240,000
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {COMP_ROWS.map((r) => (
            <div
              key={r.company}
              className="flex items-center justify-between text-[13px]"
            >
              <span className="text-slate-500">{r.company}</span>
              <span
                className={`font-mono text-xs font-semibold ${
                  r.tone === "emerald" ? "text-emerald-600" : "text-slate-900"
                }`}
              >
                {r.comp}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-[13px] font-semibold text-sky-600 transition hover:bg-sky-100">
        <SlidersHorizontal className="h-4 w-4" />
        Adjust Target Levels
      </button>
    </div>
  );
}

export function PipelinePanels() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <WeeklyActions />
      <FunnelPanel />
      <CompBenchmark />
    </div>
  );
}
