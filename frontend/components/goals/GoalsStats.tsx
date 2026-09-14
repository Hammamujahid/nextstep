"use client";

import { Brain, CircleCheck, Flag, Gauge, Timer, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type StatCard = {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: typeof Flag;
  iconCls: string;
};

const CARDS: StatCard[] = [
  {
    label: "Primary Focus",
    value: (
      <>
        1{" "}
        <span className="align-middle text-xs font-medium text-slate-500">
          Target Career Path
        </span>
      </>
    ),
    sub: (
      <span className="flex items-center gap-1.5 text-emerald-600">
        <CircleCheck className="h-4 w-4" /> Active and On schedule
      </span>
    ),
    icon: Flag,
    iconCls: "text-sky-600",
  },
  {
    label: "Specialized Tracks",
    value: (
      <>
        2{" "}
        <span className="align-middle text-xs font-medium text-slate-500">
          Active Skill Pods
        </span>
      </>
    ),
    sub: (
      <span className="flex items-center gap-1.5 text-slate-500">
        <Timer className="h-4 w-4 text-sky-500" /> 14 modules remaining
      </span>
    ),
    icon: Brain,
    iconCls: "text-sky-600",
  },
  {
    label: "Total Progress",
    value: (
      <>
        72<span className="text-lg font-bold text-sky-600">%</span>{" "}
        <span className="align-middle text-xs font-medium text-slate-500">
          Aggregate completion
        </span>
      </>
    ),
    sub: (
      <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-sky-400 to-sky-500" />
      </span>
    ),
    icon: Gauge,
    iconCls: "text-emerald-600",
  },
  {
    label: "Target Velocity",
    value: (
      <>
        +18%{" "}
        <span className="align-middle text-xs font-medium text-slate-500">
          vs last month
        </span>
      </>
    ),
    sub: (
      <span className="flex items-center gap-1.5 text-emerald-600">
        <TrendingUp className="h-4 w-4" /> Ahead by 11 days
      </span>
    ),
    icon: Gauge,
    iconCls: "text-sky-600",
  },
];

export default function GoalsStats() {
  return (
    <section
      aria-label="Goal statistics"
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {CARDS.map((c) => (
        <div
          key={c.label}
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="mb-1 flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {c.label}
            </span>
            <c.icon className={`h-5 w-5 ${c.iconCls}`} />
          </div>
          <p className="text-3xl font-bold leading-none tracking-tight text-slate-900">
            {c.value}
          </p>
          <div className="mt-2 text-[13px]">{c.sub}</div>
        </div>
      ))}
    </section>
  );
}
