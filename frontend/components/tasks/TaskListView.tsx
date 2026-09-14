"use client";

import { CalendarDays, Timer } from "lucide-react";
import { BOARD_LANES, type BoardTask } from "../../lib/dashboard";

type TaskListViewProps = {
  tasks: BoardTask[];
  onToggle: (id: number) => void;
};

const LANE_LABEL: Record<BoardTask["lane"], string> = Object.fromEntries(
  BOARD_LANES.map((l) => [l.key, l.label])
) as Record<BoardTask["lane"], string>;

export default function TaskListView({ tasks, onToggle }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No tasks match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {tasks.map((task) => {
        const done = task.lane === "completed";
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 p-4 transition hover:bg-slate-50/70"
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => onToggle(task.id)}
              aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
              className="h-4 w-4 shrink-0 cursor-pointer rounded accent-sky-500"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-semibold ${
                  done ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {task.title}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span className="font-medium text-sky-600">{task.tag}</span>
                <span aria-hidden="true">•</span>
                <span>{LANE_LABEL[task.lane]}</span>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {task.dueLabel}
                </span>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {task.estimate}
                </span>
              </p>
            </div>
            <span
              className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${
                task.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : task.priority === "medium"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {task.priority === "high"
                ? "High"
                : task.priority === "medium"
                  ? "Med"
                  : "Low"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
