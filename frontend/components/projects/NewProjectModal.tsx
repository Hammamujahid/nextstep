"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FolderKanban, X } from "lucide-react";

export type NewProjectInput = {
  name: string;
  description: string;
  assigneeId: number | null;
};

type NewProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewProjectInput) => void;
  assignees?: { id: number; name: string }[];
};

export default function NewProjectModal({
  open,
  onClose,
  onSave,
  assignees,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeValue, setAssigneeValue] = useState("");

  const close = useCallback(() => {
    setName("");
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
    if (!name.trim()) return;
    const assigneeOptions = assignees ?? [];
    onSave({
      name: name.trim(),
      description: description.trim(),
      assigneeId:
        assigneeValue !== "" && assigneeOptions.some((a) => String(a.id) === assigneeValue)
          ? Number(assigneeValue)
          : null,
    });
    close();
  }

  const labelCls = "mb-1 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full clay-sm px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  // Portal ke body: posisi modal selalu relatif ke layar device,
  // tidak ketarik tinggi/rendahnya konten halaman.
  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new project"
    >
      <div
        className="anim-pop-in m-auto max-h-[90vh] w-full max-w-lg overflow-y-auto clay shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
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
              className="w-full resize-none clay-sm p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="proj-assignee" className={labelCls}>
              Assign To
            </label>
            <select
              id="proj-assignee"
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
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="btn-shine rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Project
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
