"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, X } from "lucide-react";
import type { ProjectStatus } from "../../lib/dashboard";

export type NewProjectInput = {
  name: string;
  description: string;
  stack: string[];
  status: ProjectStatus;
};

type NewProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewProjectInput) => void;
};

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in-progress", label: "In Progress" },
  { value: "polish", label: "Polish Stage" },
  { value: "completed", label: "Completed" },
];

export default function NewProjectModal({
  open,
  onClose,
  onSave,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stackRaw, setStackRaw] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");

  const close = useCallback(() => {
    setName("");
    setDescription("");
    setStackRaw("");
    setStatus("planning");
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
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      stack: stackRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6),
      status,
    });
    close();
  }

  const labelCls = "mb-1 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new project"
    >
      <div
        className="anim-pop-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <FolderKanban className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                New Project
              </h3>
              <p className="text-xs text-slate-500">
                Start tracking a new build or prototype.
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

        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="proj-name" className={labelCls}>
              Project Name
            </label>
            <input
              id="proj-name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DevFolio v2"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="proj-desc" className={labelCls}>
              Description
            </label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-stack" className={labelCls}>
                Tech Stack (comma separated)
              </label>
              <input
                id="proj-stack"
                type="text"
                value={stackRaw}
                onChange={(e) => setStackRaw(e.target.value)}
                placeholder="e.g. Next.js, Go, Redis"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="proj-status" className={labelCls}>
                Stage
              </label>
              <select
                id="proj-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
              disabled={!name.trim()}
              className="btn-shine rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
