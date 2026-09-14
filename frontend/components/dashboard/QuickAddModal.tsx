"use client";

import { useCallback, useEffect, useState } from "react";
import { ListPlus, Loader2, X } from "lucide-react";
import type { TaskPriority } from "../../lib/dashboard";

export type QuickTaskInput = {
  title: string;
  priority: TaskPriority;
  due: string;
  dueToday: boolean;
  project: string | null;
};

type QuickAddModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: QuickTaskInput) => void;
};

const PRIORITIES: TaskPriority[] = ["High", "Medium", "Normal"];
const DUE_OPTIONS = ["Today", "Tomorrow", "This Week", "Next Week"];
const PROJECT_OPTIONS = [
  "Become a Fullstack Developer (Primary Goal)",
  "DevFolio v2",
  "PulseAPI Engine",
];

export default function QuickAddModal({
  open,
  onClose,
  onSave,
}: QuickAddModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [due, setDue] = useState(DUE_OPTIONS[1]);
  const [project, setProject] = useState(PROJECT_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const close = useCallback(() => {
    setTitle("");
    setPriority("Medium");
    setDue(DUE_OPTIONS[1]);
    setProject(PROJECT_OPTIONS[0]);
    setSaving(false);
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
    setSaving(true);
    onSave({
      title: title.trim(),
      priority,
      due: due === "Today" ? "Due Today" : due,
      dueToday: due === "Today",
      project: project.startsWith("Become a") ? "Goal: Fullstack Dev" : project,
    });
    close();
  }

  const selectCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Add next step"
    >
      <div
        className="anim-pop-in flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-sky-500" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Add Next Step
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

        <div>
          <label
            htmlFor="quick-task-title"
            className="mb-1.5 block text-[13px] font-semibold text-slate-700"
          >
            Task Description
          </label>
          <input
            id="quick-task-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="e.g., Practice mock interview with Dan"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quick-task-priority"
              className="mb-1.5 block text-[13px] font-semibold text-slate-700"
            >
              Priority
            </label>
            <select
              id="quick-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={selectCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="quick-task-due"
              className="mb-1.5 block text-[13px] font-semibold text-slate-700"
            >
              Due Timeline
            </label>
            <select
              id="quick-task-due"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={selectCls}
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="quick-task-project"
            className="mb-1.5 block text-[13px] font-semibold text-slate-700"
          >
            Associated Goal / Project
          </label>
          <select
            id="quick-task-project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className={selectCls}
          >
            {PROJECT_OPTIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
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
            disabled={!title.trim() || saving}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Action
          </button>
        </div>
      </div>
    </div>
  );
}
