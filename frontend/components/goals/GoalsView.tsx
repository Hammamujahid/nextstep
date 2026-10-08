/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  ListChecks,
  Plus,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import NewGoalModal, { type NewGoalInput } from "./NewGoalModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import AccessDenied from "../ui/AccessDenied";
import { canEdit as canEditPerm, canRead as canReadPerm } from "../../lib/permissions";
import { fetchGoals, fetchGoalTasks, fetchGoalProjects, fetchAssignableMembers, createGoal as createGoalApi, updateGoalApi, deleteGoalApi, type PrimaryGoal, type ApiTask, type ApiProject, type AssignableMember } from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";
import RowActionMenu from "../ui/RowActionMenu";
import AssigneeSelect from "../ui/AssigneeSelect";
import EditGoalModal, { type EditGoalInput } from "./EditGoalModal";

type GoalTab = "all" | "active" | "completed";
type GoalSort = "progress" | "recent" | "name";

const TABS: { key: GoalTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const SORTS: { key: GoalSort; label: string }[] = [
  { key: "progress", label: "Progress" },
  { key: "recent", label: "Recently updated" },
  { key: "name", label: "Name" },
];

// ikon visual deterministik per goal (hiasan saja, konsisten per id)
const GOAL_ICONS = [
  { icon: Target, style: "bg-blue-50 text-blue-500" },
  { icon: BriefcaseBusiness, style: "bg-emerald-50 text-emerald-500" },
  { icon: FolderKanban, style: "bg-purple-50 text-purple-500" },
  { icon: TrendingUp, style: "bg-orange-50 text-orange-500" },
];

function goalVisual(id: number) {
  return GOAL_ICONS[Math.abs(id) % GOAL_ICONS.length];
}

type BadgeStatus = "On Track" | "At Risk" | "Completed" | "Archived";

function badgeOf(status: string): BadgeStatus {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "On Track";
  if (status === "archived") return "Archived";
  return "At Risk";
}

const BADGE_STYLE: Record<BadgeStatus, string> = {
  "On Track": "bg-emerald-50 text-emerald-600",
  Completed: "bg-blue-50 text-blue-500",
  "At Risk": "bg-orange-50 text-orange-500",
  Archived: "bg-slate-100 text-slate-500",
};

function fmtUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

let nextGoalId = 1000;

function GoalCard({
  goal,
  workspaceId,
  refreshKey,
  onEdit,
  onDelete,
  canEdit,
  assignees,
  onAssigneeChange,
}: {
  goal: PrimaryGoal;
  workspaceId: number;
  refreshKey?: number;
  onEdit: (goal: PrimaryGoal) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  assignees: { id: number; name: string }[];
  onAssigneeChange: (id: number, assigneeId: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<ApiTask[] | null>(null);
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  async function loadDetails() {
    if (tasks === null && !loadingTasks) {
      setLoadingTasks(true);
      try {
        const data = await fetchGoalTasks(workspaceId, goal.id);
        setTasks(data ?? []);
      } catch {
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    }
    if (projects === null && !loadingProjects) {
      setLoadingProjects(true);
      try {
        const data = await fetchGoalProjects(workspaceId, goal.id);
        setProjects(data ?? []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }
  }

  // realtime: jika expanded dan ada update via SSE (refreshKey), refetch tasks/projects
  useEffect(() => {
    if (!expanded || refreshKey === undefined) return;
    setTasks(null);
    setProjects(null);
    void loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  function toggle() {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand) void loadDetails();
  }

  const progress = goal.progress ?? 0;
  const badge = badgeOf(goal.status);
  const visual = goalVisual(goal.id);
  const GoalIcon = visual.icon;

  return (
    <article className="group rounded-2xl border border-slate-200 transition hover:border-blue-200 hover:shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_180px_170px_60px] lg:items-center">
        <div className="flex gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.style}`}>
            <GoalIcon size={21} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-800">{goal.title}</h3>
            {goal.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{goal.description}</p>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              Updated {fmtUpdated(goal.updated_at)} · {goal.total_tasks} tasks · {goal.total_projects} projects
            </p>
            <div className="mt-1.5">
              <AssigneeSelect
                assigneeId={goal.assignee_id ?? null}
                assigneeName={goal.assignee?.username}
                assignees={assignees}
                onChange={(next) => onAssigneeChange(goal.id, next)}
                canEdit={canEdit}
                label={`Change assignee of ${goal.title}`}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {goal.completed_tasks} / {goal.total_tasks} tasks
            </span>
            <span className="text-sm font-bold text-slate-700">{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="lg:border-l lg:border-slate-100 lg:pl-5">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${BADGE_STYLE[badge]}`}>
            {badge}
          </span>
        </div>

        <div className="flex items-center gap-1 lg:justify-end">
          <button
            onClick={toggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
            title={expanded ? "Hide details" : "Show tasks & projects"}
            className="rounded-md p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
          </button>
          {canEdit && (
            <RowActionMenu
              label={goal.title}
              onEdit={() => onEdit(goal)}
              onDelete={() => onDelete(goal.id)}
            />
          )}
        </div>
      </div>

      {expanded && (
        <div className="anim-slide-down space-y-4 border-t border-slate-100 bg-slate-50/50 p-5">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ListChecks className="h-4 w-4 text-blue-500" />
              Linked tasks
              <span className="text-xs font-medium text-slate-400">{tasks?.length ?? 0}</span>
            </h4>
            {loadingTasks ? (
              <div className="mt-2 space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="mt-2 space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${t.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.priority === "high" ? "bg-red-100 text-red-600" : t.priority === "medium" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>{t.priority}</span>
                        <span>{t.status.replace("_", " ")}</span>
                        {t.due_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(t.due_date).toLocaleDateString()}, {new Date(t.due_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${t.status === "completed" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-indigo-500" : "bg-slate-300"}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed bg-white p-4 text-center text-sm text-slate-400">Belum ada tasks terhubung ke goal ini.</p>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              Linked projects
              <span className="text-xs font-medium text-slate-400">{projects?.length ?? 0}</span>
            </h4>
            {loadingProjects ? (
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                {projects.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">{p.project_name.charAt(0)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{p.project_name}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-500">{p.status.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed bg-white p-4 text-center text-sm text-slate-400">Belum ada project terhubung ke goal ini.</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function GoalsView() {
  const { active, myRole, perms, permsLoading } = useDashboard();
  const readable = canReadPerm(myRole, perms, "goal");
  const editable = canEditPerm(myRole, perms, "goal");
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  const [assignees, setAssignees] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<GoalTab>("all");
  const [sort, setSort] = useState<GoalSort>("progress");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingGoal, setEditingGoal] = useState<PrimaryGoal | null>(null);

  const activeId = active?.id;

  // kembali ke halaman 1 setiap filter/sort/search/workspace berubah
  useEffect(() => {
    setPage(1);
  }, [tab, sort, query, activeId]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetchGoals(activeId)
      .then((data) => {
        if (cancelled) return;
        setGoals(data ?? []);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchAssignableMembers(activeId, "goal")
      .then((data) => {
        if (!cancelled) setAssignees(data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // SSE satu arah: server push progress setelah client toggle checkbox
  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (ev.type === "goal_progress" && ev.data) {
        const updated = ev.data as PrimaryGoal;
        setGoals((prev) => prev.map((g) => (g.id === (updated as any).id ? { ...g, ...(updated as any) } : g)));
        setRefreshKey((k) => k + 1);
      } else if (ev.type === "goals_refresh" || ev.type === "task_toggled" || ev.type === "task_created" || ev.type === "goal_created" || ev.type === "task_updated" || ev.type === "task_deleted" || ev.type === "goal_updated" || ev.type === "goal_deleted") {
        fetchGoals(activeId)
          .then((data) => {
            if (data) setGoals(data);
          })
          .catch(() => {});
        setRefreshKey((k) => k + 1);
      }
    });
    return () => disconnect();
  }, [activeId]);

  async function addGoal(input: NewGoalInput) {
    if (!active) return;
    try {
      const created = await createGoalApi(active.id, {
        title: input.title,
        description: input.description || null,
        status: "not_started",
        assignee_id: input.assigneeId,
      });
      const mapped: PrimaryGoal = {
        id: created.id,
        workspace_id: created.workspace_id,
        title: created.title,
        description: created.description,
        status: created.status,
        assignee_id: created.assignee_id ?? null,
        assignee: created.assignee ?? null,
        created_at: created.created_at,
        updated_at: created.updated_at,
        total_projects: 0,
        completed_projects: 0,
        total_tasks: 0,
        completed_tasks: 0,
        total_requirements: 0,
        completed_requirements: 0,
        progress: 0,
      };
      setGoals((prev) => [mapped, ...prev]);
    } catch (e) {
      // fallback optimistic jika API gagal
      nextGoalId += 1;
      const fallback: PrimaryGoal = {
        id: nextGoalId,
        workspace_id: active?.id ?? 0,
        title: input.title,
        description: input.description || null,
        status: "not_started",
        assignee_id: input.assigneeId,
        assignee: input.assigneeId != null
          ? {
              id: input.assigneeId,
              username: assignees.find((a) => a.user_id === input.assigneeId)?.username ?? "",
              email: assignees.find((a) => a.user_id === input.assigneeId)?.email ?? "",
            }
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_projects: 0,
        completed_projects: 0,
        total_tasks: 0,
        completed_tasks: 0,
        total_requirements: 0,
        completed_requirements: 0,
        progress: 0,
      };
      setGoals((prev) => [fallback, ...prev]);
    }
    setTab("all");
    setPage(1);
  }

  async function handleEditSave(input: EditGoalInput) {
    if (!active || !editingGoal) return;
    const targetId = editingGoal.id;
    const prevGoals = goals;
    // aturan edit goals: modal hanya untuk title + description,
    // assignee diubah lewat dropdown inline di kartu
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== targetId
          ? g
          : {
              ...g,
              title: input.title,
              description: input.description || null,
            }
      )
    );
    setEditingGoal(null);
    try {
      const patch: { title?: string; description?: string | null } = {};
      if (input.title !== editingGoal.title) patch.title = input.title;
      if ((input.description || null) !== (editingGoal.description || null)) {
        patch.description = input.description || null;
      }
      if (Object.keys(patch).length > 0) {
        await updateGoalApi(active.id, targetId, patch);
      }
      const data = await fetchGoals(active.id).catch(() => null);
      if (data) setGoals(data);
    } catch (e) {
      console.error("update goal failed", e);
      setGoals(prevGoals);
    }
  }

  async function handleAssigneeChange(id: number, assigneeId: number | null) {
    if (!active) return;
    const target = goals.find((g) => g.id === id);
    if (!target || (target.assignee_id ?? null) === assigneeId) return;
    const prevGoals = goals;
    const nextName =
      assigneeId != null
        ? (assignees.find((a) => a.user_id === assigneeId)?.username ?? target.assignee?.username ?? null)
        : null;
    setGoals((prev) =>
      prev.map((g) =>
        g.id !== id
          ? g
          : {
              ...g,
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
      await updateGoalApi(
        active.id,
        id,
        assigneeId == null ? { clear_assignee_id: true } : { assignee_id: assigneeId }
      );
      const data = await fetchGoals(active.id).catch(() => null);
      if (data) setGoals(data);
    } catch (e) {
      console.error("update assignee failed", e);
      setGoals(prevGoals);
    }
  }

  async function handleDelete(id: number) {
    if (!active) return;
    const prevGoals = goals;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGoalApi(active.id, id);
      const data = await fetchGoals(active.id).catch(() => null);
      if (data) setGoals(data);
    } catch (e) {
      console.error("delete goal failed", e);
      setGoals(prevGoals);
    }
  }

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const onTrack = goals.filter((g) => g.status === "in_progress").length;
    const atRisk = goals.filter((g) => g.status !== "completed" && g.status !== "in_progress").length;
    const overall = total ? Math.round(goals.reduce((s, g) => s + (g.progress ?? 0), 0) / total) : 0;
    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");
    return { total, completed, onTrack, atRisk, overall, pct };
  }, [goals]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = goals.filter((g) => {
      if (tab === "completed" && g.status !== "completed") return false;
      if (tab === "active" && g.status === "completed") return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    if (sort === "progress") {
      sorted.sort((a, b) => {
        if ((b.progress ?? 0) !== (a.progress ?? 0)) return (b.progress ?? 0) - (a.progress ?? 0);
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    } else if (sort === "recent") {
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [goals, tab, sort, query]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const attention = useMemo(
    () =>
      [...goals]
        .filter((g) => g.status !== "completed")
        .sort((a, b) => {
          const aRisk = a.status === "not_started" ? 0 : (a.progress ?? 0);
          const bRisk = b.status === "not_started" ? 0 : (b.progress ?? 0);
          if (aRisk !== bRisk) return aRisk - bRisk;
          return (a.progress ?? 0) - (b.progress ?? 0);
        })
        .slice(0, 4),
    [goals]
  );

  const tabCount = (t: GoalTab) =>
    t === "all" ? goals.length : t === "completed"
      ? goals.filter((g) => g.status === "completed").length
      : goals.filter((g) => g.status !== "completed").length;

  if (!permsLoading && !readable) {
    return <AccessDenied resource="Goals" />;
  }

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <Target size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Goals
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Set your goals, track your progress, and turn your plans into achievements.
            </p>
          </div>
        </div>
        {editable && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Plus size={18} />
            New Goal
          </button>
        )}
      </section>

      {/* OVERVIEW + NEEDS ATTENTION */}
      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="clay p-5 sm:p-6">
          <h2 className="font-bold text-slate-900">Goal Overview</h2>
          <div className="mt-5 flex items-center gap-6">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#34d399"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="302"
                  strokeDashoffset={302 - (302 * stats.overall) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.overall}%</p>
                <p className="text-[10px] text-slate-400">Overall Progress</p>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-4 text-sm">
              {[
                { color: "bg-emerald-400", label: "On Track", value: stats.onTrack },
                { color: "bg-orange-400", label: "At Risk", value: stats.atRisk },
                { color: "bg-slate-300", label: "Completed", value: stats.completed },
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                    <span className="text-xs text-slate-500">{l.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{l.value}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400">{stats.total} goals total</p>
            </div>
          </div>
        </div>

        <div className="clay p-5 sm:p-6">
          <h2 className="font-bold text-slate-900">Goals Need Attention</h2>
          <div className="mt-4 space-y-3">
            {attention.length === 0 && (
              <p className="text-sm text-slate-400">All clear — nothing needs attention.</p>
            )}
            {attention.map((g) => {
              const badge = badgeOf(g.status);
              return (
                <div key={g.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="truncate text-xs font-semibold text-slate-700">{g.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {g.completed_tasks} / {g.total_tasks} tasks · {g.progress ?? 0}%
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_STYLE[badge]}`}>
                      {badge}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${g.progress ?? 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN GRID (full width list) */}
      <section>
        <div className="clay overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Goals List</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Manage and track all your goals in one place.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search goals..."
                    aria-label="Search goals"
                    className="w-44 rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  />
                </div>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as GoalSort)}
                    aria-label="Sort goals"
                    className="appearance-none clay-sm py-2.5 pl-3 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
                  >
                    {SORTS.map((o) => (
                      <option key={o.key} value={o.key}>
                        Sort by: {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-7 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap border-b-2 pb-3 text-sm ${
                    tab === t.key
                      ? "border-blue-500 font-semibold text-blue-500"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                  <span className="ml-1 text-xs">{tabCount(t.key)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4">
            {permsLoading || loading ? (
              [0, 1].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 p-5">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))
            ) : visible.length === 0 ? (
              <div className="clay border-2 border-dashed border-indigo-200 p-10 text-center">
                <ListChecks className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  {query ? `No goals match "${query}".` : "Belum ada goals. Buat goal pertama untuk mulai tracking."}
                </p>
              </div>
            ) : (
              paged.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  workspaceId={active!.id}
                  refreshKey={refreshKey}
                  onEdit={setEditingGoal}
                  onDelete={handleDelete}
                  canEdit={editable}
                  assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
                  onAssigneeChange={handleAssigneeChange}
                />
              ))
            )}
            {error && !loading && (
              <p className="px-1 text-xs text-red-500">{error}</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length} goals
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    aria-current={n === currentPage ? "page" : undefined}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      n === currentPage
                        ? "bg-blue-500 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CTA */}
      {editable && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-sky-100 p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-lg font-bold text-slate-800">
                Turn Your Dreams Into Plans
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Set a goal, break it down into smaller steps, and make it happen with NextStep.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-semibold text-blue-500 transition hover:bg-blue-50"
            >
              <Plus size={17} />
              New Goal
            </button>
          </div>
        </section>
      )}

      <NewGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addGoal}
        assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
      />
      {editingGoal && (
        <EditGoalModal
          key={editingGoal.id}
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
