"use client";

import { ArrowUp, Sprout } from "lucide-react";

export default function FooterBanner() {
  return (
    <section className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-sky-100 blur-3xl"
      />
      <div className="relative flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Sprout className="h-6 w-6" />
        </span>
        <div>
          <p className="font-bold text-slate-900">
            Every goal starts with the next step.
          </p>
          <p className="text-sm text-slate-500">
            Focus on today&apos;s highest leverage action and let compounding
            do the rest.
          </p>
        </div>
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="relative inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-100 hover:text-sky-700"
      >
        <ArrowUp className="h-4 w-4" />
        Back to Top
      </button>
    </section>
  );
}
