"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, X } from "lucide-react";
import type { ApiApplication } from "../../lib/dashboardApi";

export type EditApplicationInput = {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
};

type EditApplicationModalProps = {
  app: ApiApplication;
  onClose: () => void;
  onSave: (input: EditApplicationInput) => void;
};

// Aturan edit applications: modal hanya untuk title, company name, url.
// status, due date, assignee diubah lewat dropdown inline di pipeline/tabel.
export default function EditApplicationModal({ app, onClose, onSave }: EditApplicationModalProps) {
  const [jobTitle, setJobTitle] = useState(app.job_title);
  const [companyName, setCompanyName] = useState(app.company_name);
  const [jobUrl, setJobUrl] = useState(app.job_url ?? "");

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
    if (!jobTitle.trim() || !companyName.trim()) return;
    onSave({
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobUrl: jobUrl.trim(),
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
      aria-label={`Edit ${app.job_title}`}
    >
      <div
        className="anim-pop-in m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-sky-500" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Edit Application
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

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-app-job-title" className={labelCls}>
              Job Title
            </label>
            <input
              id="edit-app-job-title"
              type="text"
              autoFocus
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="edit-app-company" className={labelCls}>
              Company Name
            </label>
            <input
              id="edit-app-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. OpenAI, Linear, Apple"
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="edit-app-url" className={labelCls}>
            Job Posting URL
          </label>
          <input
            id="edit-app-url"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="https://..."
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
            disabled={!jobTitle.trim() || !companyName.trim()}
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
