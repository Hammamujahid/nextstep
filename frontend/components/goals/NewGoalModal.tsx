"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";

export type NewGoalInput = {
  title: string;
  description: string;
  assigneeId: number | null;
};

type NewGoalModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewGoalInput) => void;
  assignees?: { id: number; name: string }[];
};

export default function NewGoalModal({
  open,
  onClose,
  onSave,
  assignees,
}: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeValue, setAssigneeValue] = useState("");

  const close = useCallback(() => {
    setTitle("");
    setDescription("");
    setAssigneeValue("");
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
    const assigneeOptions = assignees ?? [];
    onSave({
      title: title.trim(),
      description: description.trim(),
      assigneeId:
        assigneeValue !== "" && assigneeOptions.some((a) => String(a.id) === assigneeValue)
          ? Number(assigneeValue)
          : null,
    });
    close();
  }

  const labelCls =
    "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
  const inputCls =
    "h-10 w-full rounded-xl bg-slate-100 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new goal"
    >
      <div
        className="anim-pop-in m-auto flex w-full max-w-lg flex-col gap-4 clay p-6 shadow-2xl"
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

        <div>
          <label htmlFor="goal-description" className={labelCls}>
            Description
          </label>
          <input
            id="goal-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Become expert in cloud infrastructure and deployment"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="goal-assignee" className={labelCls}>
            Assign To
          </label>
          <select
            id="goal-assignee"
            value={(assignees ?? []).some((a) => String(a.id) === assigneeValue) ? assigneeValue : ""}
            onChange={(e) => setAssigneeValue(e.target.value)}
            className={inputCls}
          >
            <option value="">Unassigned</option>
            {(assignees ?? []).map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </select>
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
            className="btn-shine rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Track
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
