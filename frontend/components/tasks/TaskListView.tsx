"use client";

import { useState } from "react";
import { CalendarDays, Timer, ChevronDown } from "lucide-react";
import { BOARD_LANES, parseEstimateToMinutes, type BoardTask } from "../../lib/dashboard";

type TaskListViewProps = {
  tasks: BoardTask[];
  onToggle: (id: number) => void;
  onStatusChange: (id: number, status: BoardTask["status"]) => void;
  onPriorityChange: (id: number, priority: BoardTask["priority"]) => void;
  onDueChange: (id: number, dueDateISO: string | null) => void;
  onEstimateChange: (id: number, minutes: number) => void;
};

const LANE_LABEL: Record<BoardTask["lane"], string> = Object.fromEntries(
  BOARD_LANES.map((l) => [l.key, l.label])
) as Record<BoardTask["lane"], string>;

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

function StatusDropdown({
  task,
  onStatusChange,
}: {
  task: BoardTask;
  onStatusChange: (id: number, status: BoardTask["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((s) => s.value === task.status) || STATUS_OPTIONS[0];
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        {current.label}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            aria-label="Close status menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setOpen(false);
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
  );
}

function PriorityDropdown({
  task,
  onPriorityChange,
}: {
  task: BoardTask;
  onPriorityChange: (id: number, priority: BoardTask["priority"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const badge =
    task.priority === "high"
      ? "bg-red-100 text-red-700"
      : task.priority === "medium"
        ? "bg-slate-100 text-slate-600"
        : "bg-slate-100 text-slate-500";
  const label = task.priority === "high" ? "High" : task.priority === "medium" ? "Med" : "Low";
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change priority, current ${label}`}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 ${badge}`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            aria-label="Close priority menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setOpen(false);
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
  );
}

function DueDropdown({
  task,
  onDueChange,
}: {
  task: BoardTask;
  onDueChange: (id: number, dueDateISO: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  function openMenu() {
    const parts = splitISODateTime(task.dueDateISO);
    setCustomDate(parts.date);
    setCustomTime(parts.time);
    setOpen(true);
  }

  function applyCustom() {
    if (!customDate) return;
    const picked = new Date(`${customDate}T${customTime || "09:00"}`);
    if (Number.isNaN(picked.getTime())) return;
    setOpen(false);
    onDueChange(task.id, picked.toISOString());
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change due date"
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <CalendarDays className="h-3 w-3" />
        {task.dueLabel}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            aria-label="Close due date menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {DUE_PRESETS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setOpen(false);
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
                onClick={applyCustom}
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
  );
}

function EstimateDropdown({
  task,
  onEstimateChange,
}: {
  task: BoardTask;
  onEstimateChange: (id: number, minutes: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function applyCustom() {
    const minutes = parseEstimateToMinutes(custom);
    if (minutes === null) return;
    setOpen(false);
    setCustom("");
    if (minutes === task.estimateMinutes) return;
    onEstimateChange(task.id, minutes);
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change estimated time"
        className="flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Timer className="h-3 w-3" />
        {task.estimate}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            aria-label="Close estimate menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-[60] mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="space-y-2 px-3 py-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Custom (e.g. 45m or 1.5h)
              </label>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyCustom();
                }}
                placeholder="e.g., 45m or 1.5h"
                className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
              />
              <button
                onClick={applyCustom}
                disabled={parseEstimateToMinutes(custom) === null}
                className="w-full rounded-lg bg-sky-400 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Set estimate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TaskListView({ tasks, onToggle, onStatusChange, onPriorityChange, onDueChange, onEstimateChange }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No tasks match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      {tasks.map((task) => {
        const done = task.status === "completed";
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-white p-4 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50/70"
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => onToggle(task.id)}
              aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
              className="h-4 w-4 shrink-0 cursor-pointer rounded accent-sky-500"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-semibold ${
                  done ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {task.title}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span>{LANE_LABEL[task.lane]}</span>
                <span aria-hidden="true">•</span>
                <DueDropdown task={task} onDueChange={onDueChange} />
                <span aria-hidden="true">•</span>
                <EstimateDropdown task={task} onEstimateChange={onEstimateChange} />
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <PriorityDropdown task={task} onPriorityChange={onPriorityChange} />
              <StatusDropdown task={task} onStatusChange={onStatusChange} />
            </div>
            <div className="shrink-0 sm:hidden">
              <StatusDropdown task={task} onStatusChange={onStatusChange} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
