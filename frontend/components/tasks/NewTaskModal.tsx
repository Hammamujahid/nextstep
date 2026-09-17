"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListPlus, Loader2, X } from "lucide-react";
import { parseEstimateToMinutes, type BoardPriority } from "../../lib/dashboard";

export type NewBoardTaskInput = {
  title: string;
  priority: BoardPriority;
  due: string;
  dueToday: boolean;
  dueKey: "today" | "week" | "overdue";
  estimateMinutes: number | null;
  goal: string | null;
  goalId: number | null;
  project: string | null;
  projectId: number | null;
};

type NewTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewBoardTaskInput) => void;
  projects?: { id: number; name: string }[];
  goals?: { id: number; name: string }[];
};

const PRIORITIES: { value: BoardPriority; label: string }[] = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" },
];

const DUE_OPTIONS = ["Today", "Tomorrow", "This Week", "Next Week"] as const;

export default function NewTaskModal({
  open,
  onClose,
  onSave,
  projects,
  goals,
}: NewTaskModalProps) {
  const projectOptions = useMemo(
    () => (projects && projects.length > 0 ? ["No Project", ...projects.map((p) => p.name)] : ["No Project"]),
    [projects]
  );
  const goalOptions = useMemo(
    () => (goals && goals.length > 0 ? ["No Goal", ...goals.map((g) => g.name)] : ["No Goal"]),
    [goals]
  );

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<BoardPriority>("medium");
  const [due, setDue] = useState<(typeof DUE_OPTIONS)[number]>("Tomorrow");
  const [project, setProject] = useState("No Project");
  const [goal, setGoal] = useState("No Goal");
  const [estimate, setEstimate] = useState("30m");
  const [saving, setSaving] = useState(false);

  const effectiveProject = projectOptions.includes(project) ? project : projectOptions[0];
  const effectiveGoal = goalOptions.includes(goal) ? goal : goalOptions[0];

  const close = useCallback(() => {
    setTitle("");
    setPriority("medium");
    setDue("Tomorrow");
    setProject("No Project");
    setGoal("No Goal");
    setEstimate("30m");
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
    const selectedProject = projects?.find((p) => p.name === effectiveProject);
    const selectedGoal = goals?.find((g) => g.name === effectiveGoal);
    const dueToday = due === "Today";
    let dueKey: "today" | "week" | "overdue" = "week";
    if (due === "Today") dueKey = "today";
    else if (due === "Tomorrow" || due === "This Week") dueKey = "week";
    else dueKey = "week";
    onSave({
      title: title.trim(),
      priority,
      due: due === "Today" ? "Due Today" : due,
      dueToday,
      dueKey,
      estimateMinutes: parseEstimateToMinutes(estimate) ?? 30,
      goal: effectiveGoal === "No Goal" ? null : effectiveGoal,
      goalId: selectedGoal?.id ?? null,
      project: effectiveProject === "No Project" ? null : effectiveProject,
      projectId: selectedProject?.id ?? null,
    });
    close();
  }

  const labelCls = "mb-1.5 block text-[13px] font-semibold text-slate-700";
  const inputCls = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Create new step"
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
          <label htmlFor="board-task-title" className={labelCls}>
            Task Description
          </label>
          <input
            id="board-task-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="e.g., Practice mock interview with Dan"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="board-task-priority" className={labelCls}>
              Priority
            </label>
            <select
              id="board-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as BoardPriority)}
              className={inputCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="board-task-due" className={labelCls}>
              Due Timeline
            </label>
            <select
              id="board-task-due"
              value={due}
              onChange={(e) => setDue(e.target.value as typeof DUE_OPTIONS[number])}
              className={inputCls}
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="board-task-estimate" className={labelCls}>
            Estimated Time
          </label>
          <input
            id="board-task-estimate"
            type="text"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="e.g., 45m or 1.5h"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="board-task-goal" className={labelCls}>
              Goal
            </label>
            <select id="board-task-goal" value={effectiveGoal} onChange={(e) => setGoal(e.target.value)} className={inputCls}>
              {goalOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="board-task-project" className={labelCls}>
              Project
            </label>
            <select id="board-task-project" value={effectiveProject} onChange={(e) => setProject(e.target.value)} className={inputCls}>
              {projectOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
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
