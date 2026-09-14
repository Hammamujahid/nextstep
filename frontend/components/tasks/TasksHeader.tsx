"use client";

import { List, ListPlus, SquareKanban } from "lucide-react";

export type BoardView = "board" | "list";

type TasksHeaderProps = {
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  onNewTask: () => void;
};

export default function TasksHeader({
  view,
  onViewChange,
  onNewTask,
}: TasksHeaderProps) {
  const toggleBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
      active
        ? "bg-sky-100 font-semibold text-sky-700 shadow-sm"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
          Momentum Engine
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Tasks and Daily Steps
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500 sm:text-base">
          Execute deliberate, measurable steps toward your career milestones
          without the cognitive friction.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Board layout"
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        >
          <button
            role="tab"
            aria-selected={view === "board"}
            onClick={() => onViewChange("board")}
            className={toggleBtn(view === "board")}
          >
            <SquareKanban className="h-4 w-4" />
            Board
          </button>
          <button
            role="tab"
            aria-selected={view === "list"}
            onClick={() => onViewChange("list")}
            className={toggleBtn(view === "list")}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
        <button
          onClick={onNewTask}
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
        >
          <ListPlus className="h-4 w-4" />
          New Task
        </button>
      </div>
    </div>
  );
}
