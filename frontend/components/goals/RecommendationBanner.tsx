"use client";

import { Lightbulb, Moon, Rocket } from "lucide-react";

export default function RecommendationBanner({
  onSnooze,
}: {
  onSnooze: () => void;
}) {
  return (
    <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-100 p-5 sm:p-6 md:flex-row">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
          <Lightbulb className="h-6 w-6" />
        </span>
        <div>
          <h4 className="text-[15px] font-bold text-slate-900">
            Next Step Recommendation
          </h4>
          <p className="text-[13px] text-slate-500">
            Based on your Stripe loop tomorrow, dedicate 45 minutes to review
            Postgres transaction locks and indexing strategies in SchemaCraft.
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
        <button
          onClick={onSnooze}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 md:w-auto"
        >
          <Moon className="h-4 w-4" />
          Snooze 1 day
        </button>
        <button className="btn-shine inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-400 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-sky-500 md:w-auto">
          <Rocket className="h-4 w-4" />
          Launch Study Session
        </button>
      </div>
    </section>
  );
}
