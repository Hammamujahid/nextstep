"use client";

import { CalendarDays, Check, Timer } from "lucide-react";
import type { BoardTask } from "../../lib/dashboard";

const PRIORITY_BADGE: Record<BoardTask["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-slate-100 text-slate-600",
  low: "bg-slate-100 text-slate-500",
};

const PRIORITY_LABEL: Record<BoardTask["priority"], string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

const TAG_BADGE: Record<BoardTask["tag"], string> = {
  "Tech Prep": "bg-sky-100 text-sky-700",
  Applications: "bg-sky-100 text-sky-700",
  "DevFolio v2": "bg-slate-100 text-slate-600",
};

const DUE_TEXT: Record<BoardTask["dueTone"], string> = {
  danger: "text-red-600 font-semibold",
  primary: "text-sky-600 font-semibold",
  muted: "text-slate-500",
  success: "text-emerald-600 font-semibold",
};

type TaskCardProps = {
  task: BoardTask;
  onToggle: (id: number) => void;
};

export default function TaskCard({ task, onToggle }: TaskCardProps) {
  const done = task.lane === "completed";

  return (
    <article
      className={`group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        done ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={done}
            onChange={() => onToggle(task.id)}
            aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
            className="h-4 w-4 shrink-0 cursor-pointer rounded accent-sky-500"
          />
          <span
            className={`truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_BADGE[task.tag]} ${
              done ? "line-through opacity-70" : ""
            }`}
          >
            {task.tag}
          </span>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE[task.priority]}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      <h3
        className={`text-sm font-semibold leading-snug transition group-hover:text-sky-600 ${
          done ? "text-slate-400 line-through" : "text-slate-900"
        }`}
      >
        {task.title}
      </h3>

      {task.description && !done && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {task.description}
        </p>
      )}

      {task.progress != null && !done && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5 text-xs text-slate-500">
        <span className={`flex items-center gap-1 ${DUE_TEXT[task.dueTone]}`}>
          <CalendarDays className="h-3.5 w-3.5" />
          {done && task.completedLabel ? task.completedLabel : task.dueLabel}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" />
          {task.estimate}
        </span>
      </div>

      {done && (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Done
        </span>
      )}
    </article>
  );
}
