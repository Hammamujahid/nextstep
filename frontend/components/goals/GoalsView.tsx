/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ListChecks, FolderKanban, AlertCircle, CalendarDays } from "lucide-react";
import GoalsHeader from "./GoalsHeader";
import NewGoalModal, { type NewGoalInput } from "./NewGoalModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import { fetchGoals, fetchGoalTasks, fetchGoalProjects, createGoal as createGoalApi, formatStatus, type PrimaryGoal, type ApiTask, type ApiProject } from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";

type TrackFilter = "all" | "complete" | "progress" | "pipeline";

const TRACK_FILTERS: { key: TrackFilter; label: string }[] = [
  { key: "all", label: "All Tracks" },
  { key: "complete", label: "Completed" },
  { key: "progress", label: "In Progress" },
  { key: "pipeline", label: "Not Started" },
];

let nextGoalId = 1000;

function GoalCard({ goal, workspaceId, refreshKey }: { goal: PrimaryGoal; workspaceId: number; refreshKey?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<ApiTask[] | null>(null);
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // realtime: jika expanded dan ada update via SSE (refreshKey), refetch tasks/projects
  useEffect(() => {
    if (!expanded || refreshKey === undefined) return;
    // refetch saat refreshKey berubah (artinya ada toggle di workspace)
    const doRefetch = async () => {
      setLoadingTasks(true);
      try {
        const data = await fetchGoalTasks(workspaceId, goal.id);
        setTasks(data ?? []);
      } catch {
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
      setLoadingProjects(true);
      try {
        const data = await fetchGoalProjects(workspaceId, goal.id);
        setProjects(data ?? []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    doRefetch();
  }, [refreshKey, expanded, workspaceId, goal.id]);

  const toggle = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand) {
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
  };

  const progress = goal.progress ?? 0;
  const statusLabel = formatStatus(goal.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-md">
      {/* Header + Master Track Progress (always visible) */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${goal.status === "completed" ? "bg-emerald-100 text-emerald-700" : goal.status === "in_progress" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                {statusLabel}
              </span>
              <span className="text-xs text-slate-400">• {new Date(goal.updated_at).toLocaleDateString()}</span>
            </div>
            <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{goal.title}</h3>
            {goal.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{goal.description}</p>
            )}
          </div>
          <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 sm:flex">
            <FolderKanban className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Master Track Progress{" "}
              <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-500">
                {goal.completed_requirements}/{goal.total_requirements} req
              </span>
            </p>
            <span className="text-sm font-bold text-sky-600">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 p-0.5">
            <div className="anim-grow-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{goal.completed_tasks}/{goal.total_tasks} tasks</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{goal.completed_projects}/{goal.total_projects} projects</span>
          </div>
        </div>

        <button
          onClick={toggle}
          aria-expanded={expanded}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-sky-600"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Sembunyikan detail
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Lihat detail tasks & projects
            </>
          )}
        </button>
      </div>

      {/* Expandable sections */}
      {expanded && (
        <div className="anim-slide-down border-t border-slate-100 bg-slate-50/50">
          {/* The Tasks That Will Get Me There */}
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ListChecks className="h-4 w-4 text-sky-500" />
                The Tasks That Will Get Me There
              </h4>
              <span className="text-xs text-slate-500">{tasks?.length ?? 0} tasks</span>
            </div>
            {loadingTasks ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${t.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.priority === "high" ? "bg-red-100 text-red-600" : t.priority === "medium" ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"}`}>{t.priority}</span>
                        <span>{t.status.replace("_", " ")}</span>
                        {t.due_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString()}, {new Date(t.due_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${t.status === "completed" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-sky-400" : "bg-slate-300"}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed bg-white p-4 text-center text-sm text-slate-400">Belum ada tasks terhubung ke goal ini.</p>
            )}
          </div>

          {/* Integrated Portfolio Projects */}
          <div className="border-t border-slate-100 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FolderKanban className="h-4 w-4 text-sky-500" />
                Integrated Portfolio Projects
              </h4>
              <span className="text-xs text-slate-500">{projects?.length ?? 0} projects</span>
            </div>
            {loadingProjects ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-white p-3 shadow-sm">
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {projects.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{p.project_name.charAt(0)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{p.project_name}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{p.project_description ?? "-"}</p>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.status === "completed" ? "bg-emerald-100 text-emerald-600" : p.status === "in_progress" ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"}`}>{p.status.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed bg-white p-4 text-center text-sm text-slate-400">Belum ada project terhubung ke goal ini.</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function GoalsView() {
  const { active } = useDashboard();
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"progress" | "deadline" | "recent">("progress");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeId = active?.id;

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetchGoals(activeId)
      .then((data) => {
        if (!cancelled) {
          setGoals(data ?? []);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // SSE satu arah: server push progress setelah client toggle checkbox
  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      console.log("[GoalsView SSE]", ev);
      if (ev.type === "goal_progress" && ev.data) {
        const updated = ev.data as PrimaryGoal;
        setGoals((prev) => prev.map((g) => (g.id === (updated as any).id ? { ...g, ...(updated as any) } : g)));
        setRefreshKey((k) => k + 1);
      } else if (ev.type === "goals_refresh" || ev.type === "task_toggled" || ev.type === "task_created" || ev.type === "goal_created" || ev.type === "task_updated") {
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
      });
      // Map backend Goal -> PrimaryGoal shape (progress 0, no req yet)
      const mapped: PrimaryGoal = {
        id: created.id,
        workspace_id: created.workspace_id,
        title: created.title,
        description: created.description,
        status: created.status,
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
    setTrackFilter("all");
  }

  const visible = useMemo(() => {
    const rank: Record<string, number> = {
      completed: 4,
      in_progress: 3,
      not_started: 2,
      archived: 1,
    };
    const filtered =
      trackFilter === "all"
        ? [...goals]
        : goals.filter((g) => {
            if (trackFilter === "complete") return g.status === "completed";
            if (trackFilter === "progress") return g.status === "in_progress";
            if (trackFilter === "pipeline") return g.status === "not_started";
            return true;
          });
    if (sort === "progress") {
      filtered.sort((a, b) => {
        const ra = rank[a.status] ?? 0;
        const rb = rank[b.status] ?? 0;
        if (ra !== rb) return rb - ra;
        if (a.progress !== b.progress) return b.progress - a.progress;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    } else if (sort === "deadline") {
      filtered.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    } else {
      filtered.sort((a, b) => b.id - a.id);
    }
    return filtered;
  }, [goals, sort, trackFilter]);

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <GoalsHeader
        onNewGoal={() => setModalOpen(true)}
        onToggleFilters={() => setFiltersVisible((v) => !v)}
        filtersVisible={filtersVisible}
      />
      {filtersVisible && (
        <div className="anim-slide-down flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Track status:</span>
          {TRACK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTrackFilter(f.key)}
              aria-pressed={trackFilter === f.key}
              className={`rounded-lg px-3 py-1.5 text-[13px] transition ${
                trackFilter === f.key
                  ? "bg-slate-800 font-semibold text-white shadow-sm"
                  : "bg-white font-medium text-slate-500 shadow-sm hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white p-6 shadow-sm">
              <div className="h-5 w-1/3 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-full rounded bg-slate-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm font-semibold text-red-600">Gagal load goals</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Belum ada goals. Buat goal pertama untuk mulai tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((g) => (
            <GoalCard key={g.id} goal={g} workspaceId={active!.id} refreshKey={refreshKey} />
          ))}
        </div>
      )}

      <NewGoalModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={addGoal} />
    </div>
  );
}
