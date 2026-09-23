"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";
import type { PrimaryGoal } from "../../lib/dashboardApi";

export type EditGoalInput = {
  title: string;
  description: string;
};

type EditGoalModalProps = {
  goal: PrimaryGoal;
  onClose: () => void;
  onSave: (input: EditGoalInput) => void;
};

export default function EditGoalModal({ goal, onClose, onSave }: EditGoalModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description ?? "");

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
    });
  }

  const labelCls = "mb-1 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${goal.title}`}
    >
      <div
        className="anim-pop-in m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-sky-500" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Edit Goal
            </h3>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor="edit-goal-title" className={labelCls}>
            Goal Title
          </label>
          <input
            id="edit-goal-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="Goal title"
            className={inputCls}
          />
        </div>

        <div className="mt-3">
          <label htmlFor="edit-goal-description" className={labelCls}>
            Description
          </label>
          <input
            id="edit-goal-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="Goal description"
            className={inputCls}
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
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
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
