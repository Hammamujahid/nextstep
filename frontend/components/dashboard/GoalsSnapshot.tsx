"use client";

import { Target } from "lucide-react";
import { SKILL_TRACKS } from "../../lib/dashboard";

export default function GoalsSnapshot() {
  return (
    <section aria-label="Career goals snapshot">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-sky-500" />
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Goals Snapshot
        </h2>
      </div>
      <div className="mt-3 space-y-3">
        {SKILL_TRACKS.map((track) => (
          <div
            key={track.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="text-sm font-bold text-slate-900">
              {track.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{track.detail}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
                  style={{ width: `${track.progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-sky-600">
                {track.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
