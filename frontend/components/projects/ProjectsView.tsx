/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  ChevronDown,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import NewProjectModal, { type NewProjectInput } from "./NewProjectModal";
import EditProjectModal, { type EditProjectInput } from "./EditProjectModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import AccessDenied from "../ui/AccessDenied";
import RowActionMenu from "../ui/RowActionMenu";
import { canEdit as canEditPerm, canRead as canReadPerm } from "../../lib/permissions";
import {
  fetchProjects,
  fetchAssignableMembers,
  createProject,
  updateProjectApi,
  deleteProjectApi,
  type ApiProject,
  type AssignableMember,
} from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";
import AssigneeSelect from "../ui/AssigneeSelect";
import InlineSelect from "../ui/InlineSelect";

type ProjectStatus = "not_started" | "in_progress" | "completed" | "archived";
type StatusFilter = ProjectStatus | "all";
type ViewMode = "grid" | "list";
type SortKey = "progress" | "recent" | "name";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "not_started", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  not_started: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_STYLE: Record<ProjectStatus, string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-blue-50 text-blue-500",
  completed: "bg-emerald-50 text-emerald-600",
  archived: "bg-slate-200 text-slate-500",
};

// gradasi hiasan deterministik per project (visual saja, konsisten per id)
const GRADIENTS = [
  "from-sky-400 to-blue-500",
  "from-blue-400 to-sky-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-sky-500",
  "from-orange-400 to-amber-500",
  "from-sky-400 to-blue-500",
];

function gradientOf(id: number): string {
  return GRADIENTS[Math.abs(id) % GRADIENTS.length];
}

function fmtUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProjectsView() {
  const { active, myRole, perms, permsLoading } = useDashboard();
  const readable = canReadPerm(myRole, perms, "project");
  const editable = canEditPerm(myRole, perms, "project");
  const activeId = active?.id;
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [assignees, setAssignees] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("progress");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiProject | null>(null);

  const fetchData = async (withLoading = true) => {
    if (!active) return;
    if (withLoading) setLoading(true);
    try {
      const data = await fetchProjects(active.id).catch(() => [] as ApiProject[]);
      setProjects(data ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetchProjects(activeId)
      .then((data) => {
        if (cancelled) return;
        setProjects(data ?? []);
        setError(null);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Failed to load projects");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchAssignableMembers(activeId, "project")
      .then((data) => {
        if (!cancelled) setAssignees(data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (ev.type === "project_created" || ev.type === "project_updated" || ev.type === "project_deleted" || ev.type === "goals_refresh") {
        void fetchData(false);
      }
    });
    return () => disconnect();
  }, [activeId]);

  async function addProject(input: NewProjectInput) {
    if (!active) return;
    try {
      await createProject(active.id, {
        project_name: input.name,
        project_description: input.description || null,
        assignee_id: input.assigneeId,
      });
      await fetchData();
    } catch (e) {
      console.error("create project failed", e);
    }
    setStatus("all");
    setSearch("");
  }

  async function handleEditSave(input: EditProjectInput) {
    if (!active || !editing) return;
    const targetId = editing.id;
    const patch: {
      project_name?: string;
      project_description?: string | null;
      assignee_id?: number | null;
      clear_assignee_id?: boolean;
    } = {
      project_name: input.name,
      project_description: input.description || null,
    };
    const curAssignee = editing.assignee_id ?? null;
    if (input.assigneeId !== curAssignee) {
      if (input.assigneeId == null) patch.clear_assignee_id = true;
      else patch.assignee_id = input.assigneeId;
    }
    const nextAssigneeName =
      input.assigneeId != null
        ? (assignees.find((a) => a.user_id === input.assigneeId)?.username ?? editing.assignee?.username ?? null)
        : null;
    const prev = projects;
    setProjects((list) =>
      list.map((p) =>
        p.id !== targetId
          ? p
          : {
              ...p,
              ...patch,
              assignee_id: input.assigneeId,
              assignee:
                input.assigneeId != null
                  ? {
                      id: input.assigneeId,
                      username: nextAssigneeName ?? "",
                      email:
                        assignees.find((a) => a.user_id === input.assigneeId)?.email ??
                        editing.assignee?.email ??
                        "",
                    }
                  : null,
            }
      )
    );
    setEditing(null);
    try {
      await updateProjectApi(active.id, targetId, patch);
      await fetchData();
    } catch (e) {
      console.error("update project failed", e);
      setProjects(prev);
    }
  }

  async function handleDelete(project: ApiProject) {
    if (!active) return;
    const prev = projects;
    setProjects((list) => list.filter((p) => p.id !== project.id));
    try {
      await deleteProjectApi(active.id, project.id);
      await fetchData();
    } catch (e) {
      console.error("delete project failed", e);
      setProjects(prev);
    }
  }

  async function handleStatusChange(id: number, next: ProjectStatus) {
    if (!active) return;
    const target = projects.find((p) => p.id === id);
    if (!target || target.status === next) return;
    const prev = projects;
    setProjects((list) => list.map((p) => (p.id !== id ? p : { ...p, status: next })));
    try {
      await updateProjectApi(active.id, id, { status: next });
      await fetchData();
    } catch (e) {
      console.error("update project status failed", e);
      setProjects(prev);
    }
  }

  async function handleAssigneeChange(id: number, assigneeId: number | null) {
    if (!active) return;
    const target = projects.find((p) => p.id === id);
    if (!target || (target.assignee_id ?? null) === assigneeId) return;
    const prev = projects;
    const nextName =
      assigneeId != null
        ? (assignees.find((a) => a.user_id === assigneeId)?.username ?? target.assignee?.username ?? null)
        : null;
    setProjects((list) =>
      list.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              assignee_id: assigneeId,
              assignee:
                assigneeId != null
                  ? {
                      id: assigneeId,
                      username: nextName ?? "",
                      email:
                        assignees.find((a) => a.user_id === assigneeId)?.email ??
                        target.assignee?.email ??
                        "",
                    }
                  : null,
            }
      )
    );
    try {
      await updateProjectApi(
        active.id,
        id,
        assigneeId == null ? { clear_assignee_id: true } : { assignee_id: assigneeId }
      );
      await fetchData();
    } catch (e) {
      console.error("update assignee failed", e);
      setProjects(prev);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      const haystack = `${p.project_name} ${p.project_description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
    const sorted = [...filtered];
    if (sort === "progress") {
      sorted.sort((a, b) => b.progress - a.progress);
    } else if (sort === "recent") {
      sorted.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    } else {
      sorted.sort((a, b) => a.project_name.localeCompare(b.project_name));
    }
    return sorted;
  }, [projects, search, status, sort]);

  const overall = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
  }, [projects]);

  const totalTasks = useMemo(() => projects.reduce((s, p) => s + p.total_tasks, 0), [projects]);
  const doneTasks = useMemo(() => projects.reduce((s, p) => s + p.completed_tasks, 0), [projects]);

  if (!permsLoading && !readable) {
    return <AccessDenied resource="Projects" />;
  }

  if (permsLoading || loading) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="h-24 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
        <div className="h-40 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-semibold text-red-600">Gagal load projects</p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold shadow-sm"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <FolderKanban size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Organize your work and turn your goals into projects.
            </p>
          </div>
        </div>
        {editable && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Plus size={18} />
            New Project
          </button>
        )}
      </section>

      {/* PROJECT PROGRESS (full width) */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Project Progress</h2>
            <p className="mt-1 text-sm text-slate-500">
              Overall progress across your active projects.
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
            <BarChart3 size={21} />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-end justify-between">
            <span className="text-sm text-slate-500">Overall completion</span>
            <span className="text-2xl font-bold text-blue-600">{overall}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${overall}%` }} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white bg-white/70 p-4">
            <p className="text-xl font-bold text-slate-800">{totalTasks}</p>
            <p className="mt-1 text-xs text-slate-400">Total Tasks</p>
          </div>
          <div className="rounded-xl border border-white bg-white/70 p-4">
            <p className="text-xl font-bold text-slate-800">{doneTasks}</p>
            <p className="mt-1 text-xs text-slate-400">Completed</p>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="clay p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              aria-label="Search projects"
              className="w-full clay-inset py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-3 text-slate-400 transition hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="appearance-none clay-sm py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value === "all" ? "All Status" : s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            {(search || status !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Reset
              </button>
            )}
            <div className="ml-2 flex rounded-xl border border-slate-200 p-1">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`rounded-lg p-2 transition ${view === "grid" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`rounded-lg p-2 transition ${view === "list" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section>
        {visible.length === 0 ? (
          <div className="clay border-2 border-dashed border-sky-200 bg-white p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <FolderKanban size={26} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">No projects found</h3>
            <p className="mt-1 text-sm text-slate-400">Try changing your search or filters.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <div
                key={p.id}
                className="group clay overflow-hidden transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className={`relative h-28 bg-gradient-to-br ${gradientOf(p.id)} p-5`}>
                  <div className="absolute inset-0 bg-white/5" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-blue-500 shadow-sm">
                      <FolderKanban size={23} />
                    </div>
                    {editable && (
                      <RowActionMenu
                        label={p.project_name}
                        onEdit={() => setEditing(p)}
                        onDelete={() => void handleDelete(p)}
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-3.5 right-5">
                    <span className={`rounded-full bg-white px-2.5 py-1 text-[10px] font-medium shadow-sm ${STATUS_STYLE[p.status as ProjectStatus]}`}>
                      {STATUS_LABEL[p.status as ProjectStatus]}
                    </span>
                  </div>
                </div>
                <div className="p-5 pt-7">
                  <h3 className="truncate font-bold text-slate-800">{p.project_name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-400">
                    {p.project_description || "No description."}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Progress</span>
                      <span className="text-xs font-bold text-blue-500">{p.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] text-slate-400">Tasks</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {p.completed_tasks}
                        <span className="font-normal text-slate-400">/{p.total_tasks}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] text-slate-400">Updated</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">{fmtUpdated(p.updated_at)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Assignee:</span>
                    <AssigneeSelect
                      assigneeId={p.assignee_id ?? null}
                      assigneeName={p.assignee?.username}
                      assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
                      onChange={(next) => void handleAssigneeChange(p.id, next)}
                      canEdit={editable}
                      label={`Change assignee of ${p.project_name}`}
                    />
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    {editable ? (
                      <InlineSelect
                        value={p.status}
                        options={(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => ({
                          value: s,
                          label: STATUS_LABEL[s],
                          dot: s === "not_started" ? "bg-slate-300" : s === "in_progress" ? "bg-blue-500" : s === "completed" ? "bg-emerald-500" : "bg-slate-400",
                        }))}
                        onChange={(v) => void handleStatusChange(p.id, v as ProjectStatus)}
                        label={`Change status of ${p.project_name}`}
                        buttonClassName="w-full clay-sm py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-xs capitalize text-slate-500">{STATUS_LABEL[p.status as ProjectStatus]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {editable && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex min-h-[310px] flex-col items-center justify-center clay border-2 border-dashed border-sky-200 bg-white text-slate-400 transition hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-500"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-current">
                  <Plus size={21} />
                </div>
                <p className="mt-4 text-sm font-semibold">Create New Project</p>
                <p className="mt-1 text-xs">Start organizing your work</p>
              </button>
            )}
          </div>
        ) : (
          <div className="clay overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">All Projects</h2>
                  <p className="mt-1 text-xs text-slate-400">{visible.length} projects found</p>
                </div>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Sort projects"
                    className="appearance-none clay-sm py-2 pl-3 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
                  >
                    <option value="progress">Sort by: Progress</option>
                    <option value="recent">Sort by: Recent</option>
                    <option value="name">Sort by: Name</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[940px]">
                <thead>
                  <tr className="border-b border-sky-100/70 bg-sky-50/50 text-left text-xs text-slate-400">
                    <th className="px-5 py-4 font-medium">Project</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium">Progress</th>
                    <th className="px-4 py-4 font-medium">Tasks</th>
                    <th className="px-4 py-4 font-medium">Updated</th>
                    <th className="px-4 py-4 font-medium">Assignee</th>
                    <th className="w-12 px-4 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientOf(p.id)} text-white`}>
                            <FolderKanban size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{p.project_name}</p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                              {p.project_description || "No description."}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {editable ? (
                          <InlineSelect
                            value={p.status}
                            options={(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => ({
                              value: s,
                              label: STATUS_LABEL[s],
                              dot: s === "not_started" ? "bg-slate-300" : s === "in_progress" ? "bg-blue-500" : s === "completed" ? "bg-emerald-500" : "bg-slate-400",
                            }))}
                            onChange={(v) => void handleStatusChange(p.id, v as ProjectStatus)}
                            label={`Change status of ${p.project_name}`}
                            buttonClassName={`rounded-full py-1 pl-2.5 pr-1.5 text-[10px] font-medium outline-none transition ${STATUS_STYLE[p.status as ProjectStatus]}`}
                          />
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLE[p.status as ProjectStatus]}`}>
                            {STATUS_LABEL[p.status as ProjectStatus]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-slate-400">Progress</span>
                            <span className="text-[10px] font-semibold text-blue-500">{p.progress}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {p.completed_tasks}/{p.total_tasks}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {fmtUpdated(p.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <AssigneeSelect
                          assigneeId={p.assignee_id ?? null}
                          assigneeName={p.assignee?.username}
                          assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
                          onChange={(next) => void handleAssigneeChange(p.id, next)}
                          canEdit={editable}
                          label={`Change assignee of ${p.project_name}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        {editable && (
                          <RowActionMenu
                            label={p.project_name}
                            onEdit={() => setEditing(p)}
                            onDelete={() => void handleDelete(p)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addProject}
        assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
      />
      {editing && (
        <EditProjectModal
          key={editing.id}
          project={editing}
          assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
          onClose={() => setEditing(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
