"use client";

import { Ellipsis } from "lucide-react";
import { BOARD_LANES, type BoardLane, type BoardTask } from "../../lib/dashboard";
import TaskCard from "./TaskCard";

type TaskBoardProps = {
  tasks: BoardTask[];
  onToggle: (id: number) => void;
  onStatusChange: (id: number, status: BoardTask["status"]) => void;
  onPriorityChange: (id: number, priority: BoardTask["priority"]) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEstimateChange: (id: number, minutes: number) => void;
};

export default function TaskBoard({ tasks, onToggle, onStatusChange, onPriorityChange, onDueChange, onEstimateChange }: TaskBoardProps) {
  const byLane = (lane: BoardLane) => tasks.filter((t) => t.lane === lane);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_LANES.map((lane) => {
        const items = byLane(lane.key);
        return (
          <div
            key={lane.key}
            className="flex flex-col gap-3 rounded-2xl bg-slate-100/70 p-2.5"
          >
            <div className="flex items-center justify-between px-1.5 pt-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${lane.dot}`} />
                <h2 className="truncate text-sm font-bold text-slate-900">
                  {lane.label}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
                  {items.length}
                </span>
              </div>
              <button
                aria-label={`More options for ${lane.label}`}
                className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-900"
              >
                <Ellipsis className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="flex min-h-40 flex-col gap-3">
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                  No tasks here.
                </p>
              )}
              {items.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={onToggle} onStatusChange={onStatusChange} onPriorityChange={onPriorityChange} onDueChange={onDueChange} onEstimateChange={onEstimateChange} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
