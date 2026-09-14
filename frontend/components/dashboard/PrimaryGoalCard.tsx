"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PRIMARY_GOAL } from "../../lib/dashboard";

export default function PrimaryGoalCard() {
  const goal = PRIMARY_GOAL;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-500 hover:shadow-[0_16px_40px_-16px_rgba(2,132,199,0.3)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl"
      />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
            {goal.status}
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {goal.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-base">
            {goal.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {goal.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Progress</span>
            <span className="font-bold text-sky-600">{goal.progress}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="anim-grow-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>{goal.requirements}</span>
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className="group inline-flex items-center gap-0.5 font-semibold text-sky-600 hover:text-sky-700"
            >
              Details
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
