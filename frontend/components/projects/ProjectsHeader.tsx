"use client";

import { Plus } from "lucide-react";

type ProjectsHeaderProps = {
  onNew: () => void;
  canEdit?: boolean;
};

export default function ProjectsHeader({
  onNew,
  canEdit = true,
}: ProjectsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Repository and Milestone Track
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Active Builds Projects
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500 sm:text-base">
          Tactical codebases, architectural prototypes, and client-facing demos
          in continuous development.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start lg:self-auto">
        {canEdit && (
          <button
            onClick={onNew}
            className="btn-shine inline-flex h-10 items-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
          >
            <Plus className="h-[18px] w-[18px]" />
            New Project
          </button>
        )}
      </div>
    </div>
  );
}
