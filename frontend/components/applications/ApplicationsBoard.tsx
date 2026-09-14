"use client";

import { ChartNoAxesColumn, Plus } from "lucide-react";
import {
  APP_STAGES,
  type AppStage,
  type PipelineApplication,
} from "../../lib/dashboard";
import ApplicationCard from "./ApplicationCard";

type ApplicationsBoardProps = {
  apps: PipelineApplication[];
};

export default function ApplicationsBoard({ apps }: ApplicationsBoardProps) {
  const byStage = (stage: AppStage) => apps.filter((a) => a.stage === stage);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-[1500px] items-start gap-4 xl:min-w-0 xl:grid xl:grid-cols-5">
        {APP_STAGES.map((stage) => {
          const items = byStage(stage.key);
          return (
            <div key={stage.key} className="flex w-72 shrink-0 flex-col gap-3 xl:w-auto">
              <div className="flex items-center justify-between px-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${stage.dot}`} />
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    {stage.label}
                    {stage.key !== "saved" && (
                      <span className="ml-1 font-medium text-slate-400">
                        ({items.length})
                      </span>
                    )}
                  </h2>
                  {stage.key === "saved" && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                      {items.length}
                    </span>
                  )}
                </div>
                <button
                  aria-label={`Add to ${stage.label}`}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-900"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
              </div>
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                  No applications here.
                </p>
              )}
              {items.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  ring={app.interview ? "sky" : app.offer ? "emerald" : null}
                />
              ))}
              {stage.key === "offer" && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center">
                  <ChartNoAxesColumn className="mb-1 h-7 w-7 text-slate-300" />
                  <p className="text-[13px] font-semibold text-slate-700">
                    Drag Offers Here
                  </p>
                  <p className="mt-0.5 max-w-50 text-xs text-slate-500">
                    Unlock automated salary benchmarks and negotiation playbooks.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
