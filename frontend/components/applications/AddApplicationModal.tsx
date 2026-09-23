"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, X } from "lucide-react";

export type NewApplicationInput = {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  dueDateISO: string | null;
  assigneeId: number | null;
};

type AddApplicationModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewApplicationInput) => void;
  assignees?: { id: number; name: string }[];
};

export default function AddApplicationModal({
  open,
  onClose,
  onSave,
  assignees,
}: AddApplicationModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [assigneeValue, setAssigneeValue] = useState("");

  const close = useCallback(() => {
    setJobTitle("");
    setCompanyName("");
    setJobUrl("");
    setDueDate("");
    setDueTime("");
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
    if (!jobTitle.trim() || !companyName.trim()) return;
    let dueDateISO: string | null = null;
    if (dueDate) {
      const picked = new Date(`${dueDate}T${dueTime || "09:00"}`);
      if (!Number.isNaN(picked.getTime())) dueDateISO = picked.toISOString();
    }
    const assigneeOptions = assignees ?? [];
    onSave({
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobUrl: jobUrl.trim(),
      dueDateISO,
      assigneeId:
        assigneeValue !== "" && assigneeOptions.some((a) => String(a.id) === assigneeValue)
          ? Number(assigneeValue)
          : null,
    });
    close();
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
      aria-label="Add new application"
    >
      <div
        className="anim-pop-in m-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Add New Application
              </h3>
              <p className="text-xs text-slate-500">
                Track a new role in your pipeline.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="app-job-title" className={labelCls}>
                Job Title
              </label>
              <input
                id="app-job-title"
                type="text"
                autoFocus
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="app-company" className={labelCls}>
                Company Name
              </label>
              <input
                id="app-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. OpenAI, Linear, Apple"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="app-url" className={labelCls}>
              Job Posting URL
            </label>
            <input
              id="app-url"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="app-assignee" className={labelCls}>
              Assign To
            </label>
            <select
              id="app-assignee"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="app-due-date" className={labelCls}>
                Due Date
              </label>
              <input
                id="app-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="app-due-time" className={labelCls}>
                Due Time
              </label>
              <input
                id="app-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
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
              disabled={!jobTitle.trim() || !companyName.trim()}
              className="btn-shine rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Application
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
