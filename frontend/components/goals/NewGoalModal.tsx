"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, X } from "lucide-react";
import { GOAL_CATEGORIES } from "../../lib/dashboard";

export type NewGoalInput = {
  title: string;
  category: string;
  targetDate: string;
  keyResult: string;
};

type NewGoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewGoalInput) => void;
};

export default function NewGoalModal({
  open,
  onClose,
  onSave,
}: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(GOAL_CATEGORIES[0]);
  const [targetDate, setTargetDate] = useState("2025-10-31");
  const [keyResult, setKeyResult] = useState("");

  const close = useCallback(() => {
    setTitle("");
    setCategory(GOAL_CATEGORIES[0]);
    setTargetDate("2025-10-31");
    setKeyResult("");
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
      category,
      targetDate,
      keyResult: keyResult.trim(),
    });
    close();
  }

  const labelCls =
    "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
  const inputCls =
    "h-10 w-full rounded-xl bg-slate-100 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new goal"
    >
      <div
        className="anim-pop-in flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Flag className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Create New Goal
              </h3>
              <p className="text-xs text-slate-500">
                Define a calm, structured milestone track.
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
          <label htmlFor="goal-title" className={labelCls}>
            Goal Title
          </label>
          <input
            id="goal-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Master Kubernetes & CI/CD Pipelines"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="goal-category" className={labelCls}>
              Category
            </label>
            <select
              id="goal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="goal-date" className={labelCls}>
              Target Completion
            </label>
            <input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="goal-key-result" className={labelCls}>
            Initial Key Result
          </label>
          <input
            id="goal-key-result"
            type="text"
            value={keyResult}
            onChange={(e) => setKeyResult(e.target.value)}
            placeholder="e.g., Deploy production-grade cluster on AWS EKS"
            className={inputCls}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={close}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="btn-shine rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Track
          </button>
        </div>
      </div>
    </div>
  );
}
