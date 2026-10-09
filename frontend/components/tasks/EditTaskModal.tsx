"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ListPlus, X } from "lucide-react";
import { parseEstimateToMinutes, type BoardTask } from "../../lib/dashboard";

export type EditTaskInput = {
  title: string;
  projectId: number | null;
  goalId: number | null;
  estimateMinutes: number;
};

type EditTaskModalProps = {
  task: BoardTask;
  projects?: { id: number; name: string }[];
  goals?: { id: number; name: string }[];
  onClose: () => void;
  onSave: (input: EditTaskInput) => void;
  // false = user tidak punya editor pada resource target -> kunci pilihan, pertahankan tautan lama
  canSelectProject?: boolean;
  canSelectGoal?: boolean;
};

// Aturan edit tasks: modal hanya untuk title, estimate, goal, project.
// due date, status, priority, assignee diubah lewat dropdown inline di list/board.
export default function EditTaskModal({ task, projects, goals, onClose, onSave, canSelectProject = true, canSelectGoal = true }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  // "" = No Project / No Goal
  const [projectValue, setProjectValue] = useState<string>(
    task.projectId != null ? String(task.projectId) : ""
  );
  const [goalValue, setGoalValue] = useState<string>(
    task.goalIds && task.goalIds[0] != null ? String(task.goalIds[0]) : ""
  );
  const [estimate, setEstimate] = useState(`${task.estimateMinutes}m`);

  const projectOptions = useMemo(
    () => projects ?? [],
    [projects]
  );
  const goalOptions = useMemo(() => goals ?? [], [goals]);

  // kalau id simpanan sudah tidak ada di daftar (mis. project dihapus), anggap No Project/No Goal.
  // kalau select dikunci (tanpa editor pada target), pertahankan tautan lama apa adanya.
  const effectiveProjectId = !canSelectProject
    ? (task.projectId ?? null)
    : projectValue !== "" && projectOptions.some((p) => String(p.id) === projectValue)
      ? Number(projectValue)
      : null;
  const effectiveGoalId = !canSelectGoal
    ? (task.goalIds?.[0] ?? null)
    : goalValue !== "" && goalOptions.some((g) => String(g.id) === goalValue)
      ? Number(goalValue)
      : null;

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
    if (!title.trim()) return;
    const estimateMinutes = parseEstimateToMinutes(estimate) ?? task.estimateMinutes;
    onSave({
      title: title.trim(),
      projectId: effectiveProjectId,
      goalId: effectiveGoalId,
      estimateMinutes,
    });
  }

  const labelCls = "mb-1.5 block text-[13px] font-semibold text-slate-700";
  const inputCls =
    "h-10 w-full clay-sm px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${task.title}`}
    >
      <div
        className="anim-pop-in m-auto w-full max-w-lg clay p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-sky-500" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Edit Task
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

        <div className="mt-4">
          <label
            htmlFor="edit-task-title"
            className="mb-1.5 block text-[13px] font-semibold text-slate-700"
          >
            Task Title
          </label>
          <input
            id="edit-task-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="Task title"
            className={inputCls}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="edit-task-estimate" className={labelCls}>
            Estimate (e.g. 45m, 1.5h)
          </label>
          <input
            id="edit-task-estimate"
            type="text"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="30m"
            className={inputCls}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-task-goal" className={labelCls}>
              Goal
            </label>
            <select
              id="edit-task-goal"
              value={goalOptions.some((g) => String(g.id) === goalValue) ? goalValue : ""}
              onChange={(e) => setGoalValue(e.target.value)}
              disabled={!canSelectGoal}
              title={canSelectGoal ? undefined : "Requires editor access on goals"}
              className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">No Goal</option>
              {goalOptions.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
            {!canSelectGoal && (
              <p className="mt-1 text-[11px] text-slate-400">Requires editor access on goals.</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-task-project" className={labelCls}>
              Project
            </label>
            <select
              id="edit-task-project"
              value={projectOptions.some((p) => String(p.id) === projectValue) ? projectValue : ""}
              onChange={(e) => setProjectValue(e.target.value)}
              disabled={!canSelectProject}
              title={canSelectProject ? undefined : "Requires editor access on projects"}
              className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">No Project</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
            {!canSelectProject && (
              <p className="mt-1 text-[11px] text-slate-400">Requires editor access on projects.</p>
            )}
          </div>
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
            disabled={!title.trim()}
            className="btn-shine rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
