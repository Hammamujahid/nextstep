"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ExternalLink } from "lucide-react";
import RowActionMenu from "../ui/RowActionMenu";
import {
  formatApplicationStatus,
  formatDueDateTime,
  type ApiApplication,
  type ApplicationStatus,
} from "../../lib/dashboardApi";

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

function StatusDropdown({
  app,
  onStatusChange,
  canEdit = true,
}: {
  app: ApiApplication;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current =
    STATUS_OPTIONS.find((s) => s.value === app.status) || STATUS_OPTIONS[0];

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, 160, 300));
    setOpen(true);
  }

  useDismissOnScrollResize(open, () => setOpen(false));

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={!canEdit}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change status, current ${current.label}`}
        className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 disabled:cursor-default disabled:hover:opacity-100 ${STATUS_BADGE[app.status]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        {current.label}
        {canEdit && <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />}
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <button
              aria-label="Close status menu"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[100] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setOpen(false);
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
  );
}

function DueCell({
  app,
  onDueChange,
  canEdit = true,
}: {
  app: ApiApplication;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const parts = splitISODateTime(app.due_date);
    setCustomDate(parts.date);
    setCustomTime(parts.time);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, 176, 300));
    setOpen(true);
  }

  function applyCustom() {
    if (!customDate) return;
    const picked = new Date(`${customDate}T${customTime || "09:00"}`);
    if (Number.isNaN(picked.getTime())) return;
    setOpen(false);
    onDueChange(app.id, picked.toISOString());
  }

  useDismissOnScrollResize(open, () => setOpen(false));

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={!canEdit}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change due date"
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-slate-500"
      >
        <CalendarDays className="h-3 w-3" />
        {formatDueDateTime(app.due_date)}
        {canEdit && <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />}
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <button
              aria-label="Close due date menu"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[100] w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
            >
              <button
                onClick={() => {
                  setOpen(false);
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
                  onClick={applyCustom}
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
  );
}

type ApplicationsTableProps = {
  apps: ApiApplication[];
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEdit: (app: ApiApplication) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
};

export default function ApplicationsTable({ apps, onStatusChange, onDueChange, onEdit, onDelete, canEdit = true }: ApplicationsTableProps) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No applications match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-4 py-3 font-semibold">
              Job Title
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Company Name
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Due Date
            </th>
            <th scope="col" className="w-12 px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((app) => (
            <tr key={app.id} className="transition hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">{app.job_title}</span>
                  {app.job_url && (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View job for ${app.job_title}`}
                      title="View job"
                      className="rounded p-0.5 text-slate-300 transition hover:text-sky-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-sky-600">
                    {app.company_name.charAt(0).toUpperCase()}
                  </span>
                  {app.company_name}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusDropdown app={app} onStatusChange={onStatusChange} canEdit={canEdit} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <DueCell app={app} onDueChange={onDueChange} canEdit={canEdit} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {canEdit && (
                  <RowActionMenu
                    label={`${app.job_title} at ${app.company_name}`}
                    onEdit={() => onEdit(app)}
                    onDelete={() => onDelete(app.id)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
