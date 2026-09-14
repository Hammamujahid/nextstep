"use client";

import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, X } from "lucide-react";
import { APP_STAGES, type AppStage } from "../../lib/dashboard";

export type NewApplicationInput = {
  company: string;
  role: string;
  stage: AppStage;
  location: string;
  salary: string;
  appliedLabel: string;
  notes: string;
};

type AddApplicationModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewApplicationInput) => void;
};

const LOCATION_OPTIONS = [
  "Remote (US / Americas)",
  "Remote (Global / Anywhere)",
  "Hybrid",
  "Onsite",
];

export default function AddApplicationModal({
  open,
  onClose,
  onSave,
}: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState<AppStage>("applied");
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [salary, setSalary] = useState("");
  const [appliedLabel, setAppliedLabel] = useState("Apr 16");
  const [notes, setNotes] = useState("");

  const close = useCallback(() => {
    setCompany("");
    setRole("");
    setStage("applied");
    setLocation(LOCATION_OPTIONS[0]);
    setSalary("");
    setAppliedLabel("Apr 16");
    setNotes("");
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
    if (!company.trim() || !role.trim()) return;
    onSave({
      company: company.trim(),
      role: role.trim(),
      stage,
      location,
      salary: salary.trim(),
      appliedLabel: appliedLabel.trim() || "Today",
      notes: notes.trim(),
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
      aria-label="Add new application"
    >
      <div
        className="anim-pop-in max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
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
                Keep your pipeline accurate with key contacts and timelines.
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
              <label htmlFor="app-company" className={labelCls}>
                Company Name
              </label>
              <input
                id="app-company"
                type="text"
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. OpenAI, Linear, Apple"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="app-role" className={labelCls}>
                Role Title
              </label>
              <input
                id="app-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="app-stage" className={labelCls}>
                Pipeline Stage
              </label>
              <select
                id="app-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as AppStage)}
                className={inputCls}
              >
                {APP_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="app-location-pref" className={labelCls}>
                Location Preference
              </label>
              <select
                id="app-location-pref"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputCls}
              >
                {LOCATION_OPTIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="app-salary" className={labelCls}>
                Salary Range / Target
              </label>
              <input
                id="app-salary"
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $185k - $210k"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="app-date" className={labelCls}>
                Application Date
              </label>
              <input
                id="app-date"
                type="text"
                value={appliedLabel}
                onChange={(e) => setAppliedLabel(e.target.value)}
                placeholder="e.g. Apr 16"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="app-notes" className={labelCls}>
              Notes and Recruiter Details
            </label>
            <textarea
              id="app-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Referred by Sarah, initial call covered distributed architecture..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
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
              disabled={!company.trim() || !role.trim()}
              className="btn-shine rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
