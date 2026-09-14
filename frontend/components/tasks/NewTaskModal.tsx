"use client";

import { useCallback, useEffect, useState } from "react";
import { ListPlus, X } from "lucide-react";
import {
  BOARD_TAGS,
  type BoardPriority,
  type BoardTag,
  type DueKey,
} from "../../lib/dashboard";

export type NewBoardTaskInput = {
  title: string;
  tag: BoardTag;
  priority: BoardPriority;
  dueKey: DueKey;
  estimate: string;
};

type NewTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewBoardTaskInput) => void;
};

const PRIORITIES: { value: BoardPriority; label: string }[] = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low Priority" },
];

const DUE_OPTIONS: { value: DueKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "overdue", label: "Scheduled Later" },
];

export default function NewTaskModal({
  open,
  onClose,
  onSave,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<BoardTag>("DevFolio v2");
  const [priority, setPriority] = useState<BoardPriority>("medium");
  const [dueKey, setDueKey] = useState<DueKey>("week");
  const [estimate, setEstimate] = useState("");

  const close = useCallback(() => {
    setTitle("");
    setTag("DevFolio v2");
    setPriority("medium");
    setDueKey("week");
    setEstimate("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      tag,
      priority,
      dueKey,
      estimate: estimate.trim() || "30m",
    });
    close();
  }

  const labelCls =
    "mb-1.5 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new step"
    >
      <div
        className="anim-pop-in flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <ListPlus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Create New Step
              </h3>
              <p className="text-xs text-slate-500">
                Actionable micro-step toward your goal
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label htmlFor="board-task-title" className={labelCls}>
            Task Title
          </label>
          <input
            id="board-task-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="e.g., Implement Redis token bucket strategy"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="board-task-tag" className={labelCls}>
              Linked Project / Goal
            </label>
            <select
              id="board-task-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value as BoardTag)}
              className={inputCls}
            >
              {BOARD_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t === "Applications" ? "Job Applications" : t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="board-task-priority" className={labelCls}>
              Priority
            </label>
            <select
              id="board-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as BoardPriority)}
              className={inputCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="board-task-due" className={labelCls}>
              Target Deadline
            </label>
            <select
              id="board-task-due"
              value={dueKey}
              onChange={(e) => setDueKey(e.target.value as DueKey)}
              className={inputCls}
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="board-task-est" className={labelCls}>
              Estimated Time
            </label>
            <input
              id="board-task-est"
              type="text"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="e.g., 45m or 1.5h"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={close}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="btn-shine rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}
