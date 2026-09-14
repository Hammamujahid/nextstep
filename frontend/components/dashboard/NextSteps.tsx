"use client";

import { useState } from "react";
import { CalendarClock, Check, ListChecks, Plus } from "lucide-react";
import type { DashboardTask, TaskPriority } from "../../lib/dashboard";

type TaskFilter = "all" | "high" | "today";

type NextStepsProps = {
  tasks: DashboardTask[];
  onToggle: (id: number) => void;
  onAdd: () => void;
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-sky-100 text-sky-700",
  Normal: "bg-slate-100 text-slate-500",
};

const FILTERS: { key: TaskFilter; label: (n: number) => string }[] = [
  { key: "all", label: (n) => `All (${n})` },
  { key: "high", label: (n) => `High Priority (${n})` },
  { key: "today", label: (n) => `Due Today (${n})` },
];

export default function NextSteps({ tasks, onToggle, onAdd }: NextStepsProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const openTasks = tasks.filter((t) => !t.done);

  const visible = tasks.filter((t) => {
    if (filter === "high") return t.priority === "High";
    if (filter === "today") return t.dueToday;
    return true;
  });

  const countFor = (f: TaskFilter) =>
    f === "all"
      ? openTasks.length
      : f === "high"
        ? openTasks.filter((t) => t.priority === "High").length
        : openTasks.filter((t) => t.dueToday).length;

  return (
    <section aria-label="Your next steps">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Your Next Steps
          </h2>
        </div>
        <div className="flex items-center gap-1 self-start rounded-xl bg-slate-100 p-1 sm:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-lg px-2.5 py-1 text-[13px] transition ${
                filter === f.key
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "font-medium text-slate-500 hover:text-slate-900"
              }`}
            >
              {f.label(countFor(f.key))}
            </button>
          ))}
        </div>
      </div>
      <TaskList tasks={visible} onToggle={onToggle} onAdd={onAdd} />
    </section>
  );
}

function TaskList({
  tasks,
  onToggle,
  onAdd,
}: {
  tasks: DashboardTask[];
  onToggle: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {tasks.length === 0 && (
        <p className="p-6 text-center text-sm text-slate-400">
          Nothing here. Enjoy the clear sky.
        </p>
      )}
      {tasks.map((task) => (
        <div
          key={task.id}
          data-priority={task.priority}
          data-due-today={task.dueToday ? "true" : "false"}
          data-done={task.done ? "true" : "false"}
          className="task-row flex items-start gap-3 p-4 transition hover:bg-slate-50/70"
        >
          <button
            onClick={() => onToggle(task.id)}
            aria-pressed={task.done}
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
              task.done
                ? "border-sky-400 bg-sky-400 text-white"
                : "border-slate-300 bg-white text-transparent hover:border-sky-400"
            }`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-sm font-semibold ${
                  task.done
                    ? "text-slate-400 line-through"
                    : "text-slate-900"
                }`}
              >
                {task.title}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}
              >
                {task.priority === "Normal" ? "Normal" : `${task.priority} Priority`}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span
                className={`flex items-center gap-1 font-medium ${
                  task.dueToday && !task.done ? "text-red-600" : ""
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {task.due}
              </span>
              {task.project && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="font-medium text-sky-600">
                    {task.project}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="bg-slate-50 p-2">
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100"
        >
          <Plus className="h-4 w-4" />
          Add Next Step
        </button>
      </div>
    </div>
  );
}
