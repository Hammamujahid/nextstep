"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ExternalLink } from "lucide-react";
import {
  formatApplicationStatus,
  formatDueDateTime,
  type ApiApplication,
  type ApplicationStatus,
} from "../../lib/dashboardApi";
import RowActionMenu from "../ui/RowActionMenu";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; dot: string }[] = [
  { value: "wishlist", label: "Wishlist", dot: "bg-slate-400" },
  { value: "applied", label: "Applied", dot: "bg-sky-400" },
  { value: "under_review", label: "Under Review", dot: "bg-amber-400" },
  { value: "interviewing", label: "Interviewing", dot: "bg-violet-400" },
  { value: "offered", label: "Offered", dot: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", dot: "bg-red-400" },
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-100 text-slate-600",
  applied: "bg-sky-100 text-sky-700",
  under_review: "bg-amber-100 text-amber-700",
  interviewing: "bg-violet-100 text-violet-700",
  offered: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function splitISODateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

function menuPos(rect: DOMRect, width: number, heightEstimate: number) {
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  if (rect.bottom + heightEstimate > window.innerHeight) {
    return { bottom: window.innerHeight - rect.top + 4, left };
  }
  return { top: rect.bottom + 4, left };
}

function useDismissOnScrollResize(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
}

function isOverdue(app: ApiApplication): boolean {
  if (!app.due_date) return false;
  if (app.status === "offered" || app.status === "rejected") return false;
  const due = new Date(app.due_date);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

type ApplicationCardProps = {
  app: ApiApplication;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEdit: (app: ApiApplication) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
};

export default function ApplicationCard({ app, onStatusChange, onDueChange, onEdit, onDelete, canEdit = true }: ApplicationCardProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusPos, setStatusPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [dueOpen, setDueOpen] = useState(false);
  const [duePos, setDuePos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const dueBtnRef = useRef<HTMLButtonElement>(null);
  const overdue = isOverdue(app);
  const anyMenuOpen = statusOpen || dueOpen;

  useDismissOnScrollResize(statusOpen, () => setStatusOpen(false));
  useDismissOnScrollResize(dueOpen, () => setDueOpen(false));

  function toggleStatus() {
    if (statusOpen) {
      setStatusOpen(false);
      return;
    }
    const r = statusBtnRef.current?.getBoundingClientRect();
    if (r) setStatusPos(menuPos(r, 160, 300));
    setStatusOpen(true);
  }

  function toggleDue() {
    if (dueOpen) {
      setDueOpen(false);
      return;
    }
    const parts = splitISODateTime(app.due_date);
    setCustomDate(parts.date);
    setCustomTime(parts.time);
    const r = dueBtnRef.current?.getBoundingClientRect();
    if (r) setDuePos(menuPos(r, 176, 300));
    setDueOpen(true);
  }

  function applyCustomDue() {
    if (!customDate) return;
    const picked = new Date(`${customDate}T${customTime || "09:00"}`);
    if (Number.isNaN(picked.getTime())) return;
    setDueOpen(false);
    onDueChange(app.id, picked.toISOString());
  }

  return (
    <article
      className={`group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        anyMenuOpen ? "relative z-30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-sky-600">
            {app.company_name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-sky-600">
              {app.job_title}
            </h3>
            <p className="truncate text-[13px] text-slate-500">
              {app.company_name}
            </p>
          </div>
        </div>
        {canEdit && (
          <RowActionMenu
            label={`${app.job_title} at ${app.company_name}`}
            onEdit={() => onEdit(app)}
            onDelete={() => onDelete(app.id)}
          />
        )}
      </div>

      <div className="relative">
        <button
          ref={statusBtnRef}
          onClick={toggleStatus}
          disabled={!canEdit}
          aria-haspopup="listbox"
          aria-expanded={statusOpen}
          aria-label={`Change status, current ${formatApplicationStatus(app.status)}`}
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100 ${STATUS_BADGE[app.status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${(STATUS_OPTIONS.find((s) => s.value === app.status) || STATUS_OPTIONS[0]).dot}`} />
          {formatApplicationStatus(app.status)}
          {canEdit && <ChevronDown className={`h-3 w-3 transition ${statusOpen ? "rotate-180" : ""}`} />}
        </button>
        {statusOpen &&
          statusPos &&
          createPortal(
            <>
              <button
                aria-label="Close status menu"
                className="fixed inset-0 z-[90] cursor-default bg-transparent"
                onClick={() => setStatusOpen(false)}
              />
              <div
                className="fixed z-[100] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                style={{ top: statusPos.top, bottom: statusPos.bottom, left: statusPos.left }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusOpen(false);
                      if (opt.value === app.status) return;
                      onStatusChange(app.id, opt.value);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${opt.value === app.status ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-700"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}
      </div>

      <div className="flex items-center justify-between pt-0.5 text-xs text-slate-500">
        <div className="relative">
          <button
            ref={dueBtnRef}
            onClick={toggleDue}
            disabled={!canEdit}
            aria-haspopup="listbox"
            aria-expanded={dueOpen}
            aria-label="Change due date"
            className={`flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:bg-slate-100 disabled:cursor-default disabled:hover:bg-transparent ${overdue ? "font-semibold text-red-600" : ""}`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDueDateTime(app.due_date)}
            {canEdit && <ChevronDown className={`h-3 w-3 transition ${dueOpen ? "rotate-180" : ""}`} />}
          </button>
          {dueOpen &&
            duePos &&
            createPortal(
              <>
                <button
                  aria-label="Close due date menu"
                  className="fixed inset-0 z-[90] cursor-default bg-transparent"
                  onClick={() => setDueOpen(false)}
                />
                <div
                  className="fixed z-[100] w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  style={{ top: duePos.top, bottom: duePos.bottom, left: duePos.left }}
                >
                  <button
                    onClick={() => {
                      setDueOpen(false);
                      onDueChange(app.id, null);
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    No due date
                  </button>
                  <div className="space-y-2 border-t border-slate-100 px-3 py-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Time
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                      />
                    </div>
                    <button
                      onClick={applyCustomDue}
                      disabled={!customDate}
                      className="w-full rounded-lg bg-sky-400 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Set due date
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )}
        </div>
        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700"
          >
            <ExternalLink className="h-3 w-3" />
            View Job
          </a>
        )}
      </div>
    </article>
  );
}
