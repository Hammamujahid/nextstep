"use client";

import { Folder, Target } from "lucide-react";

// Pill kecil penanda tautan task ke goal / project.
// Tidak render apa-apa kalau task tidak terhubung ke keduanya.
export default function TaskLinks({
  projectName,
  goalName,
  className = "",
}: {
  projectName?: string | null;
  goalName?: string | null;
  className?: string;
}) {
  if (!projectName && !goalName) return null;
  return (
    <span className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className}`}>
      {goalName && (
        <span
          title={`Goal: ${goalName}`}
          className="inline-flex min-w-0 max-w-36 items-center gap-1 truncate rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700"
        >
          <Target className="h-3 w-3 shrink-0" />
          <span className="truncate">{goalName}</span>
        </span>
      )}
      {projectName && (
        <span
          title={`Project: ${projectName}`}
          className="inline-flex min-w-0 max-w-36 items-center gap-1 truncate rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700"
        >
          <Folder className="h-3 w-3 shrink-0" />
          <span className="truncate">{projectName}</span>
        </span>
      )}
    </span>
  );
}
