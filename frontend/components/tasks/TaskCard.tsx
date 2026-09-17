"use client";

import { useState } from "react";
import { CalendarDays, Check, Timer, ChevronDown } from "lucide-react";
import { parseEstimateToMinutes, type BoardTask } from "../../lib/dashboard";

const PRIORITY_BADGE: Record<BoardTask["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-slate-100 text-slate-600",
  low: "bg-slate-100 text-slate-500",
};

const PRIORITY_LABEL: Record<BoardTask["priority"], string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

const STATUS_OPTIONS: { value: BoardTask["status"]; label: string; dot: string }[] = [
  { value: "not_started", label: "Not Started", dot: "bg-slate-300" },
  { value: "in_progress", label: "In Progress", dot: "bg-sky-400" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500" },
];

const PRIORITY_OPTIONS: { value: BoardTask["priority"]; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-red-500" },
  { value: "medium", label: "Med", dot: "bg-sky-400" },
  { value: "low", label: "Low", dot: "bg-slate-300" },
];

const DUE_PRESETS: { key: string; label: string }[] = [
  { key: "none", label: "No due date" },
];

const DUE_TEXT: Record<BoardTask["dueTone"], string> = {
  danger: "text-red-600 font-semibold",
  primary: "text-sky-600 font-semibold",
  muted: "text-slate-500",
  success: "text-emerald-600 font-semibold",
};

type TaskCardProps = {
  task: BoardTask;
  onToggle: (id: number) => void;
  onStatusChange: (id: number, status: BoardTask["status"]) => void;
  onPriorityChange: (id: number, priority: BoardTask["priority"]) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEstimateChange: (id: number, minutes: number) => void;
};

function presetToISO(preset: string): string | null {
  const now = new Date();
  if (preset === "none") return null;
  if (preset === "today") return now.toISOString();
  const d = new Date();
  if (preset === "tomorrow") d.setDate(d.getDate() + 1);
  else if (preset === "this_week") d.setDate(d.getDate() + 3);
  else if (preset === "next_week") d.setDate(d.getDate() + 7);
  else return null;
  return d.toISOString();
}

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

export default function TaskCard({ task, onToggle, onStatusChange, onPriorityChange, onDueChange, onEstimateChange }: TaskCardProps) {
  const done = task.status === "completed";
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [customEstimate, setCustomEstimate] = useState("");
  // Angkat kartu ke layer terdepan saat ada dropdown yang terbuka,
  // supaya menu tidak ketutupan kartu task lain di bawahnya.
  const anyMenuOpen = statusOpen || priorityOpen || dueOpen || estimateOpen;

  function applyCustomEstimate() {
    const minutes = parseEstimateToMinutes(customEstimate);
    if (minutes === null) return;
    setEstimateOpen(false);
    setCustomEstimate("");
    if (minutes === task.estimateMinutes) return;
    onEstimateChange(task.id, minutes);
  }

  function openDueMenu() {
    const parts = splitISODateTime(task.dueDateISO);
    setCustomDate(parts.date);
    setCustomTime(parts.time);
    setDueOpen(true);
  }

  function applyCustomDue() {
    if (!customDate) return;
    const picked = new Date(`${customDate}T${customTime || "09:00"}`);
    if (Number.isNaN(picked.getTime())) return;
    setDueOpen(false);
    onDueChange(task.id, picked.toISOString());
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === task.status) || STATUS_OPTIONS[0];

  return (
    <article
      className={`group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        done ? "opacity-75" : ""
      } ${anyMenuOpen ? "relative z-30" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={done}
            onChange={() => onToggle(task.id)}
            aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
            className="h-4 w-4 shrink-0 cursor-pointer rounded accent-sky-500"
          />
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setPriorityOpen(!priorityOpen)}
            aria-haspopup="listbox"
            aria-expanded={priorityOpen}
            aria-label={`Change priority, current ${PRIORITY_LABEL[task.priority]}`}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 ${PRIORITY_BADGE[task.priority]}`}
          >
            {PRIORITY_LABEL[task.priority]}
            <ChevronDown className={`h-3 w-3 transition ${priorityOpen ? "rotate-180" : ""}`} />
          </button>
          {priorityOpen && (
            <>
              <button
                aria-label="Close priority menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setPriorityOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPriorityOpen(false);
                      if (opt.value === task.priority) return;
                      onPriorityChange(task.id, opt.value);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${opt.value === task.priority ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-700"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <h3
        className={`text-sm font-semibold leading-snug transition group-hover:text-sky-600 ${
          done ? "text-slate-400 line-through" : "text-slate-900"
        }`}
      >
        {task.title}
      </h3>

      {task.description && !done && (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {task.description}
        </p>
      )}

      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => setStatusOpen(!statusOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
        >
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${currentStatus.dot}`} />
            {currentStatus.label}
          </span>
          <ChevronDown className={`h-3 w-3 transition ${statusOpen ? "rotate-180" : ""}`} />
        </button>
        {statusOpen && (
          <>
            <button
              aria-label="Close status menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setStatusOpen(false)}
            />
            <div className="absolute z-[60] mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusOpen(false);
                  if (opt.value === task.status) return;
                  onStatusChange(task.id, opt.value);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${opt.value === task.status ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-700"}`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
            </div>
          </>
        )}
      </div>

      {task.progress != null && !done && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5 text-xs text-slate-500">
        <div className="relative">
          <button
            onClick={() => (dueOpen ? setDueOpen(false) : openDueMenu())}
            aria-haspopup="listbox"
            aria-expanded={dueOpen}
            aria-label="Change due date"
            className={`flex items-center gap-1 rounded-md px-1 py-0.5 font-medium transition hover:bg-slate-100 ${DUE_TEXT[task.dueTone]}`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {done && task.completedLabel ? task.completedLabel : task.dueLabel}
            <ChevronDown className={`h-3 w-3 transition ${dueOpen ? "rotate-180" : ""}`} />
          </button>
          {dueOpen && (
            <>
              <button
                aria-label="Close due date menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setDueOpen(false)}
              />
              <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {DUE_PRESETS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setDueOpen(false);
                      onDueChange(task.id, presetToISO(opt.key));
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {opt.label}
                  </button>
                ))}
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
            </>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setEstimateOpen(!estimateOpen)}
            aria-haspopup="listbox"
            aria-expanded={estimateOpen}
            aria-label="Change estimated time"
            className="flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Timer className="h-3.5 w-3.5" />
            {task.estimate}
            <ChevronDown className={`h-3 w-3 transition ${estimateOpen ? "rotate-180" : ""}`} />
          </button>
          {estimateOpen && (
            <>
              <button
                aria-label="Close estimate menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setEstimateOpen(false)}
              />
              <div className="absolute right-0 z-[60] mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="space-y-2 px-3 py-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Custom (e.g. 45m or 1.5h)
                  </label>
                  <input
                    type="text"
                    value={customEstimate}
                    onChange={(e) => setCustomEstimate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCustomEstimate();
                    }}
                    placeholder="e.g., 45m or 1.5h"
                    className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                  />
                  <button
                    onClick={applyCustomEstimate}
                    disabled={parseEstimateToMinutes(customEstimate) === null}
                    className="w-full rounded-lg bg-sky-400 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Set estimate
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {done && (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Done
        </span>
      )}
    </article>
  );
}
