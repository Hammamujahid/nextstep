"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  FolderKanban,
  Plus,
  Target,
  Users,
} from "lucide-react";
import QuickAddModal, { type QuickTaskInput } from "./QuickAddModal";
import { canEdit as canEditPerm, canRead as canReadPerm } from "../../lib/permissions";
import {
  greetingForHour,
  toBackendPriority,
  type DashboardApplication,
  type DashboardTask,
  type DashboardProject,
  type SkillTrack,
} from "../../lib/dashboard";
import { useDashboard } from "./DashboardProvider";
import {
  fetchGoals,
  fetchProjects,
  fetchTasks,
  fetchApplications,
  fetchMetrics,
  createTask,
  toggleTaskApi,
  type ApiTask,
  type CreateTaskPayload,
  type DashboardMetrics,
} from "../../lib/dashboardApi";
import { listMembersApi } from "../../lib/workspaces";
import { connectWorkspaceEvents } from "../../lib/sse";

function mapApiTask(t: ApiTask, projectName: string | null): DashboardTask {
  const status = t.status as DashboardTask["status"];
  const isCompleted = status === "completed";
  const dueDate = t.due_date ? new Date(t.due_date) : null;
  const dueToday = dueDate
    ? new Date().toDateString() === dueDate.toDateString()
    : false;
  let dueLabel = "No due date";
  if (t.due_date && dueDate) {
    const time = dueDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    dueLabel = dueToday ? `Due Today, ${time}` : `${dueDate.toLocaleDateString()}, ${time}`;
  }
  return {
    id: t.id,
    title: t.title,
    priority: (t.priority === "high" ? "High" : t.priority === "medium" ? "Medium" : "Normal") as DashboardTask["priority"],
    status,
    due: dueLabel,
    dueToday,
    dueDate: t.due_date,
    project: projectName,
    projectId: t.project_id,
    done: isCompleted,
    isCompleted,
    updatedAt: t.updated_at,
    createdAt: t.created_at,
  };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function dueShortLabel(iso: string | null, completed = false): string {
  if (!iso) return completed ? "—" : "No date";
  const d = new Date(iso);
  if (completed) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const now = new Date();
  const diff = diffDays(d, now);
  if (diff < 0) return `Overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "To Do",
};

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-600",
  in_progress: "bg-blue-50 text-blue-600",
  not_started: "bg-slate-100 text-slate-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  High: "High",
  Medium: "Medium",
  Normal: "Low",
};

const PRIORITY_STYLE: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-orange-50 text-orange-500",
  Normal: "bg-emerald-50 text-emerald-500",
};

type TaskTab = "all" | "today" | "week" | "upcoming";

export default function DashboardHome() {
  const {
    profile,
    active,
    myRole,
    perms,
    workspaces,
    selectWorkspace,
  } = useDashboard();
  const username = profile.username;
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [projects, setProjects] = useState<DashboardProject[] | null>(null);
  const [skillTracks, setSkillTracks] = useState<SkillTrack[] | null>(null);
  const [applications, setApplications] = useState<DashboardApplication[] | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberAdmins, setMemberAdmins] = useState(0);
  const [memberNewWeek, setMemberNewWeek] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [taskTab, setTaskTab] = useState<TaskTab>("all");
  const [calCursor, setCalCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const activeId = active?.id;
  const readTask = canReadPerm(myRole, perms, "task");
  const editTask = canEditPerm(myRole, perms, "task");
  const readGoal = canReadPerm(myRole, perms, "goal");
  const readProject = canReadPerm(myRole, perms, "project");
  const readApp = canReadPerm(myRole, perms, "job_application");

  const fetchData = async () => {
    if (!activeId) return;
    const [apiTasks, apiProjects, apiGoals, apiApps, apiMetrics, apiMembers] = await Promise.all([
      fetchTasks(activeId).catch(() => null),
      fetchProjects(activeId).catch(() => null),
      fetchGoals(activeId).catch(() => null),
      fetchApplications(activeId).catch(() => null),
      fetchMetrics(activeId).catch(() => null),
      listMembersApi(activeId).catch(() => null),
    ]);
    const projMap = new Map((apiProjects ?? []).map((p) => [p.id, p.project_name]));
    if (apiTasks !== null) {
      setTasks(apiTasks.map((t) => mapApiTask(t, t.project_id ? (projMap.get(t.project_id) ?? null) : null)));
    } else {
      setTasks([]);
    }
    if (apiProjects !== null) {
      setProjects(
        apiProjects.map((p) => ({
          id: p.id,
          name: p.project_name,
          description: p.project_description ?? "",
          stage: p.status === "completed" ? "Completed" : p.status === "in_progress" ? "In Progress" : "Planning",
          stageTone: (p.status === "completed" ? "polish" : "progress") as DashboardProject["stageTone"],
          tasksDone: 0,
          tasksTotal: 0,
          status: p.status as DashboardProject["status"],
          updatedAt: p.updated_at,
        }))
      );
    } else {
      setProjects([]);
    }
    if (apiGoals !== null) {
      setSkillTracks(
        apiGoals.map((g) => ({
          id: g.id,
          title: g.title,
          detail: g.description ?? "",
          progress: g.progress,
          status: g.status as SkillTrack["status"],
          completedTasks: g.completed_tasks,
          totalTasks: g.total_tasks,
          updatedAt: g.updated_at,
        }))
      );
    } else {
      setSkillTracks([]);
    }
    if (apiApps !== null) {
      const statusMap: Record<string, DashboardApplication["statusTone"]> = {
        wishlist: "submitted",
        applied: "submitted",
        under_review: "review",
        interviewing: "interview",
        offered: "final",
        rejected: "review",
      };
      const formatAppStatus = (s: string) =>
        s === "under_review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1);
      setApplications(
        apiApps.map((a) => ({
          id: a.id,
          company: a.company_name,
          role: a.job_title,
          status: formatAppStatus(a.status),
          statusTone: statusMap[a.status] ?? "submitted",
          applied: new Date(a.created_at).toLocaleDateString(),
          note: formatAppStatus(a.status),
          noteTone: a.status === "offered" ? "emerald" : a.status === "interviewing" ? "sky" : "slate",
          updatedAt: a.updated_at,
        }))
      );
    } else {
      setApplications([]);
    }
    setMetrics(apiMetrics);
    if (apiMembers !== null) {
      const list = apiMembers.members ?? [];
      setMemberTotal(list.length);
      setMemberAdmins(list.filter((m) => m.member_role === "admin").length);
      const weekAgo = Date.now() - 7 * 86400000;
      setMemberNewWeek(list.filter((m) => new Date(m.created_at).getTime() >= weekAgo).length);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchData();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // SSE realtime: refresh semua saat ada event workspace
  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (
        ev.type === "goals_refresh" || ev.type === "goal_progress" ||
        ev.type === "task_toggled" || ev.type === "task_created" ||
        ev.type === "task_updated" || ev.type === "task_deleted" ||
        ev.type === "goal_created" || ev.type === "goal_updated" || ev.type === "goal_deleted" ||
        ev.type === "project_created" || ev.type === "project_updated" || ev.type === "project_deleted" ||
        ev.type === "application_created" || ev.type === "application_updated" || ev.type === "application_deleted"
      ) {
        void fetchData();
      }
    });
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function toggleTask(id: number) {
    if (!active) return;
    const prevTasks = tasks;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextStatus: DashboardTask["status"] = target.status === "completed" ? "not_started" : "completed";
    const nextDone = nextStatus === "completed";
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== id ? t : { ...t, status: nextStatus, done: nextDone, isCompleted: nextDone, updatedAt: now }
      )
    );
    try {
      const updated = await toggleTaskApi(active.id, id);
      const projName = updated.project_id ? (projects?.find((p) => p.id === updated.project_id)?.name ?? null) : null;
      const mapped = mapApiTask(updated, projName);
      setTasks((prev) => prev.map((t) => (t.id === id ? mapped : t)));
    } catch (e) {
      console.error("toggle task failed", e);
      setTasks(prevTasks);
    }
  }

  async function addTask(input: QuickTaskInput) {
    if (!active) return;
    const backendPriority = toBackendPriority(input.priority);
    let dueDateISO: string | null = null;
    if (input.dueToday) {
      dueDateISO = new Date().toISOString();
    } else if (input.due === "Tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDateISO = d.toISOString();
    } else if (input.due === "This Week") {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      dueDateISO = d.toISOString();
    } else if (input.due === "Next Week") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDateISO = d.toISOString();
    } else if (input.due === "Due Today") {
      dueDateISO = new Date().toISOString();
    }
    let projectId: number | null = input.projectId ?? null;
    let projectName: string | null = input.project ?? null;
    if (projectId === null && input.project && projects && projects.length > 0) {
      const found = projects.find((p) => p.name === input.project);
      if (found) {
        projectId = found.id;
        projectName = found.name;
      }
    }
    let goalId: number | null = input.goalId ?? null;
    if (goalId === null && input.goal && skillTracks && skillTracks.length > 0) {
      const foundGoal = skillTracks.find((g) => g.title === input.goal);
      if (foundGoal) goalId = foundGoal.id;
    }
    const payload: CreateTaskPayload = {
      title: input.title,
      priority: backendPriority,
      status: "not_started",
      due_date: dueDateISO,
      estimated_minutes: input.estimateMinutes ?? 30,
      project_id: projectId,
      goal_id: goalId,
    };
    try {
      const created = await createTask(active.id, payload);
      const mapped = mapApiTask(created, projectName);
      setTasks((prev) => [mapped, ...prev]);
    } catch (e) {
      console.error("create task failed", e);
    }
  }

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== "completed"), [tasks]);
  const tabCounts = useMemo(() => {
    const isToday = (t: DashboardTask) => !!t.dueDate && diffDays(new Date(t.dueDate), now) === 0;
    const inWeek = (t: DashboardTask) =>
      !!t.dueDate && diffDays(new Date(t.dueDate), now) >= 1 && diffDays(new Date(t.dueDate), now) <= 7;
    return {
      all: tasks.length,
      today: pendingTasks.filter(isToday).length,
      week: pendingTasks.filter(inWeek).length,
      upcoming: pendingTasks.filter((t) => !isToday(t) && !inWeek(t)).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const isToday = (t: DashboardTask) => !!t.dueDate && diffDays(new Date(t.dueDate), now) === 0;
    const inWeek = (t: DashboardTask) =>
      !!t.dueDate && diffDays(new Date(t.dueDate), now) >= 1 && diffDays(new Date(t.dueDate), now) <= 7;
    let list = tasks;
    if (taskTab === "today") list = pendingTasks.filter(isToday);
    else if (taskTab === "week") list = pendingTasks.filter(inWeek);
    else if (taskTab === "upcoming") list = pendingTasks.filter((t) => !isToday(t) && !inWeek(t));
    return [...list]
      .sort((a, b) => {
        const ad = a.status === "completed" ? 1 : 0;
        const bd = b.status === "completed" ? 1 : 0;
        if (ad !== bd) return ad - bd;
        const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return at - bt;
      })
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, taskTab, pendingTasks]);

  const upcomingTasks = useMemo(
    () =>
      [...pendingTasks]
        .filter((t) => t.dueDate)
        .sort((a, b) => +new Date(a.dueDate as string) - +new Date(b.dueDate as string))
        .slice(0, 4),
    [pendingTasks]
  );

  const dueDays = useMemo(() => {
    const set = new Set<number>();
    for (const t of pendingTasks) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === calCursor.getFullYear() && d.getMonth() === calCursor.getMonth()) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [pendingTasks, calCursor]);

  const calCells = useMemo(() => {
    const y = calCursor.getFullYear();
    const m = calCursor.getMonth();
    const first = new Date(y, m, 1);
    // Senin sebagai awal minggu (Mo..Su)
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [...Array<null>(lead).fill(null)];
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  }, [calCursor]);

  const calLabel = calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isTodayCell = (d: number | null) =>
    d !== null &&
    now.getFullYear() === calCursor.getFullYear() &&
    now.getMonth() === calCursor.getMonth() &&
    now.getDate() === d;

  const recentActivity = useMemo(() => {
    type Item = { key: string; text: string; at: string };
    const items: Item[] = [];
    for (const t of tasks) items.push({ key: `task-${t.id}`, text: `Task "${t.title}" updated`, at: t.updatedAt });
    for (const p of projects ?? []) items.push({ key: `proj-${p.id}`, text: `Project "${p.name}" updated`, at: p.updatedAt });
    for (const a of applications ?? []) items.push({ key: `app-${a.id}`, text: `Application "${a.role}" updated`, at: a.updatedAt });
    return items.sort((x, y) => +new Date(y.at) - +new Date(x.at)).slice(0, 5);
  }, [tasks, projects, applications]);

  const m = metrics;
  const statCards = [
    {
      title: "Total Tasks",
      value: m ? String(m.tasks.total) : "–",
      description: m ? `${m.tasks.completed} completed` : "loading…",
      icon: CheckCircle2,
      iconStyle: "bg-blue-50 text-blue-500",
    },
    {
      title: "Goals",
      value: m ? String(m.goals.total) : "–",
      description: m ? `${m.goals.in_progress} in progress` : "loading…",
      icon: Target,
      iconStyle: "bg-sky-50 text-sky-500",
    },
    {
      title: "Projects",
      value: m ? String(m.projects.total) : "–",
      description: m ? `${m.projects.in_progress} in progress` : "loading…",
      icon: FolderKanban,
      iconStyle: "bg-sky-50 text-sky-500",
    },
    {
      title: "Job Applications",
      value: m ? String(m.applications.total) : "–",
      description: m ? `${m.applications.interviewing} interviewing` : "loading…",
      icon: BriefcaseBusiness,
      iconStyle: "bg-orange-50 text-orange-500",
    },
    {
      title: "Workspace Members",
      value: String(memberTotal),
      description: `${memberAdmins} admin · ${memberNewWeek} new this week`,
      icon: Users,
      iconStyle: "bg-emerald-50 text-emerald-500",
    },
  ];

  const progressItems = m
    ? [
        { title: "Tasks Completed", value: `${m.tasks.completed} / ${m.tasks.total}`, progress: m.tasks.total ? Math.round((m.tasks.completed / m.tasks.total) * 100) : 0 },
        { title: "Goals Progress", value: `${m.goals.completed} / ${m.goals.total}`, progress: m.goals.total ? Math.round((m.goals.completed / m.goals.total) * 100) : 0 },
        { title: "Projects Progress", value: `${m.projects.completed} / ${m.projects.total}`, progress: m.projects.total ? Math.round((m.projects.completed / m.projects.total) * 100) : 0 },
        { title: "Job Offers", value: `${m.applications.offered} / ${m.applications.total}`, progress: m.applications.total ? Math.round((m.applications.offered / m.applications.total) * 100) : 0 },
      ]
    : [];

  const TABS: { key: TaskTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: tabCounts.all },
    { key: "today", label: "Today", count: tabCounts.today },
    { key: "week", label: "This Week", count: tabCounts.week },
    { key: "upcoming", label: "Upcoming", count: tabCounts.upcoming },
  ];

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      {/* GREETING */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}
            {username ? `, ${username}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your work today. Keep going!
          </p>
        </div>
        <div className="flex items-center gap-4 self-start clay px-5 py-3 shadow-sm md:self-auto">
          <div>
            <p className="text-xs text-slate-400">Today</p>
            <p className="text-sm font-semibold text-slate-900">{todayLabel}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400">Workspace</p>
            <p className="max-w-36 truncate text-sm font-semibold text-slate-900">
              {active?.name ?? "–"}
            </p>
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.title} className="clay p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconStyle}`}>
                <s.icon size={22} />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">{s.title}</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-900">{s.value}</h3>
            <p className="mt-1 text-xs text-slate-400">{s.description}</p>
          </div>
        ))}
      </section>

      {/* TASKS + CALENDAR */}
      {readTask && (
        <section className="grid items-start gap-6 xl:grid-cols-[1fr_350px]">
          <div className="clay overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Tasks</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Stay on top of your tasks and make progress.
                </p>
              </div>
              {editTask && (
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  <Plus size={17} />
                  Add Task
                </button>
              )}
            </div>
            <div className="flex gap-7 overflow-x-auto border-b border-slate-100 px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTaskTab(tab.key)}
                  className={`whitespace-nowrap border-b-2 py-4 text-sm ${
                    taskTab === tab.key
                      ? "border-blue-500 font-semibold text-blue-500"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label} {tab.count}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto p-4">
              {visibleTasks.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-slate-400">
                  Nothing here. Enjoy the clear sky.
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="px-3 py-3 font-medium">Task</th>
                      <th className="px-3 py-3 font-medium">Priority</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((t) => (
                      <tr key={t.id} className="border-t border-slate-100">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={t.status === "completed"}
                              disabled={!editTask}
                              onChange={() => toggleTask(t.id)}
                              aria-label={t.status === "completed" ? `Reopen ${t.title}` : `Complete ${t.title}`}
                              className="h-4 w-4 shrink-0 cursor-pointer rounded accent-blue-500 disabled:cursor-not-allowed"
                            />
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-medium ${t.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                {t.title}
                              </p>
                              {t.project && (
                                <p className="mt-0.5 truncate text-xs text-slate-400">{t.project}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${PRIORITY_STYLE[t.priority]}`}>
                            {PRIORITY_LABEL[t.priority]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                            {STATUS_LABEL[t.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
                          {dueShortLabel(t.dueDate, t.status === "completed")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Link
              href="/dashboard/tasks"
              className="flex items-center justify-center gap-1 border-t border-slate-100 py-3 text-sm font-semibold text-blue-500 transition hover:bg-blue-50/50"
            >
              View all tasks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <div className="clay p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={19} className="text-blue-500" />
                  <h2 className="font-bold text-slate-900">Calendar</h2>
                </div>
                <Link href="/dashboard/tasks" className="text-xs font-medium text-blue-500 hover:text-blue-600">
                  View All
                </Link>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{calLabel}</p>
                  <div className="flex gap-1">
                    <button
                      aria-label="Previous month"
                      onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1))}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Next month"
                      onClick={() => setCalCursor(new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1))}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-y-3 text-center text-xs">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} className="font-medium text-slate-400">
                      {d}
                    </span>
                  ))}
                  {calCells.map((d, i) =>
                    d === null ? (
                      <span key={`e-${i}`} />
                    ) : (
                      <span key={d} className="flex flex-col items-center gap-0.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            isTodayCell(d)
                              ? "bg-blue-500 font-semibold text-white"
                              : "text-slate-600"
                          }`}
                        >
                          {d}
                        </span>
                        <span className={`h-1 w-1 rounded-full ${dueDays.has(d) ? "bg-blue-400" : "bg-transparent"}`} />
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="clay p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Upcoming Tasks</h2>
                <Link href="/dashboard/tasks" className="text-xs font-medium text-blue-500 hover:text-blue-600">
                  View All
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {upcomingTasks.length === 0 && (
                  <p className="text-sm text-slate-400">No dated tasks ahead.</p>
                )}
                {upcomingTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {t.status === "completed" ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {dueShortLabel(t.dueDate)} · {active?.name ?? "workspace"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CARDS */}
      <section className="grid items-start gap-6 lg:grid-cols-3">
        <div className="clay p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Workspace Overview</h2>
            <Link href="/dashboard/members" className="text-xs font-medium text-blue-500 hover:text-blue-600">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {workspaces.map((w) => {
              const isActive = w.id === active?.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    if (!isActive) selectWorkspace(w.id);
                  }}
                  disabled={isActive}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                    isActive ? "bg-blue-50 ring-1 ring-blue-200" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {w.name}
                      {isActive && (
                        <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          active
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">{w.member_role}</p>
                  </div>
                  {!isActive && <ArrowUpRight size={16} className="shrink-0 text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {(readTask || readGoal || readProject || readApp) && (
          <div className="clay p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Progress Overview</h2>
            </div>
            {progressItems.length === 0 && (
              <p className="text-sm text-slate-400">Loading…</p>
            )}
            {progressItems.map((p) => (
              <div key={p.title} className="mb-5 last:mb-0">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-600">{p.title}</span>
                  <span className="text-xs text-slate-400">{p.value}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="mt-1 text-right text-[10px] text-slate-400">{p.progress}%</p>
              </div>
            ))}
          </div>
        )}

        <div className="clay p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="space-y-5">
            {recentActivity.length === 0 && (
              <p className="text-sm text-slate-400">No activity yet.</p>
            )}
            {recentActivity.map((a, i) => (
              <div key={a.key} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-500">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs leading-5 text-slate-600">{a.text}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock3 className="h-3 w-3" />
                    {timeAgo(a.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-sky-100 p-7">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-bold text-slate-800">
              Better Planning, Bigger Dreams
            </p>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Organize your tasks, set your goals, and achieve more with NextStep.
            </p>
          </div>
          <Link
            href="/dashboard/goals"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Set your next goal
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      {readTask && (
        <QuickAddModal
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSave={addTask}
          projects={(projects ?? []).map((p) => ({ id: p.id, name: p.name }))}
          goals={(skillTracks ?? []).map((g) => ({ id: g.id, name: g.title }))}
          canSelectProject={canEditPerm(myRole, perms, "project")}
          canSelectGoal={canEditPerm(myRole, perms, "goal")}
        />
      )}
    </div>
  );
}
