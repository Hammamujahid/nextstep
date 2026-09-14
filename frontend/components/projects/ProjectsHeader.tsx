"use client";

import { Check, Loader2, Plus, RefreshCw } from "lucide-react";

type ProjectsHeaderProps = {
  syncing: boolean;
  synced: boolean;
  onSync: () => void;
  onNew: () => void;
};

export default function ProjectsHeader({
  syncing,
  synced,
  onSync,
  onNew,
}: ProjectsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Repository and Milestone Track
          <span aria-hidden="true" className="text-slate-300">
            /
          </span>
          <span className="font-medium normal-case tracking-normal text-slate-500">
            4 Workstreams
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Active Builds and Portfolio Projects
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500 sm:text-base">
          Tactical codebases, architectural prototypes, and client-facing demos
          in continuous development.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start lg:self-auto">
        <button
          onClick={onSync}
          disabled={syncing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-70"
        >
          {syncing ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-slate-400" />
          ) : synced ? (
            <Check className="h-[18px] w-[18px] text-emerald-500" />
          ) : (
            <RefreshCw className="h-[18px] w-[18px] text-slate-400" />
          )}
          {syncing ? "Syncing..." : synced ? "Synced" : "Sync Git (3 repos)"}
        </button>
        <button
          onClick={onNew}
          className="btn-shine inline-flex h-10 items-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
        >
          <Plus className="h-[18px] w-[18px]" />
          New Project
        </button>
      </div>
    </div>
  );
}
