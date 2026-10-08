"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Ellipsis, Pencil, Trash2 } from "lucide-react";
import type { ApiProject } from "../../lib/dashboardApi";

export type ProjectStatus = "not_started" | "in_progress" | "completed" | "archived";

const STATUS_OPTIONS: { value: ProjectStatus; label: string; dot: string }[] = [
  { value: "not_started", label: "Not Started", dot: "bg-slate-300" },
  { value: "in_progress", label: "In Progress", dot: "bg-indigo-500" },
  { value: "completed", label: "Completed", dot: "bg-emerald-500" },
  { value: "archived", label: "Archived", dot: "bg-slate-400" },
];

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.toLocaleDateString()}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
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

function menuPos(rect: DOMRect, width: number, heightEstimate: number) {
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  if (rect.bottom + heightEstimate > window.innerHeight) {
    return { bottom: window.innerHeight - rect.top + 4, left };
  }
  return { top: rect.bottom + 4, left };
}

function StatusDropdown({
  project,
  onStatusChange,
  canEdit = true,
}: {
  project: ApiProject;
  onStatusChange: (id: number, status: ProjectStatus) => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current =
    STATUS_OPTIONS.find((s) => s.value === project.status) || STATUS_OPTIONS[0];

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, 160, 230));
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
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white disabled:cursor-default disabled:hover:bg-slate-50"
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
                    if (opt.value === project.status) return;
                    onStatusChange(project.id, opt.value);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${opt.value === project.status ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700"}`}
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

function ActionMenu({
  project,
  onEdit,
  onDelete,
}: {
  project: ApiProject;
  onEdit: (project: ApiProject) => void;
  onDelete: (project: ApiProject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos(menuPos(r, 160, 130));
    setOpen(true);
  }

  useDismissOnScrollResize(open, () => setOpen(false));

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${project.project_name}`}
        title="Actions"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Ellipsis className="h-[18px] w-[18px]" />
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <button
              aria-label="Close actions menu"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[100] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                Edit
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

type ProjectsTableProps = {
  projects: ApiProject[];
  onStatusChange: (id: number, status: ProjectStatus) => void;
  onEdit: (project: ApiProject) => void;
  onDelete: (project: ApiProject) => void;
  canEdit?: boolean;
};

export default function ProjectsTable({ projects, onStatusChange, onEdit, onDelete, canEdit = true }: ProjectsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  if (projects.length === 0) {
    return (
      <div className="clay p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No projects match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto clay">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-4 py-3 font-semibold">
              Project
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Description
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Progress
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Updated
            </th>
            <th scope="col" className="w-12 px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((p) => (
            <tr key={p.id} className="transition hover:bg-indigo-50/50">
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                {p.project_name}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                <button
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  title={p.project_description || ""}
                  className="block min-w-0 max-w-80 text-left"
                >
                  <span
                    className={
                      expandedId === p.id
                        ? "whitespace-normal break-words"
                        : "block truncate"
                    }
                  >
                    {p.project_description || "-"}
                  </span>
                  {(p.project_description?.length ?? 0) > 60 && (
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {expandedId === p.id ? "tutup" : "selengkapnya"}
                    </span>
                  )}
                </button>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusDropdown project={p} onStatusChange={onStatusChange} canEdit={canEdit} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {p.total_tasks > 0 ? (
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {p.completed_tasks}/{p.total_tasks}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                {formatUpdated(p.updated_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {canEdit && <ActionMenu project={p} onEdit={onEdit} onDelete={onDelete} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
