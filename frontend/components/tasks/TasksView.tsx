/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import NewTaskModal, { type NewBoardTaskInput } from "./NewTaskModal";
import EditTaskModal, { type EditTaskInput } from "./EditTaskModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import AccessDenied from "../ui/AccessDenied";
import RowActionMenu from "../ui/RowActionMenu";
import AssigneeSelect from "../ui/AssigneeSelect";
import InlineSelect from "../ui/InlineSelect";
import DueDateSelect from "../ui/DueDateSelect";
import TaskLinks from "./TaskLinks";
import { canEdit as canEditPerm, canRead as canReadPerm } from "../../lib/permissions";
import { fetchTasks, fetchProjects, fetchGoals, fetchAssignableMembers, createTask, toggleTaskApi, updateTaskApi, deleteTaskApi, type ApiTask, type ApiProject, type AssignableMember, type CreateTaskPayload } from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";
import { formatEstimateMinutes, type BoardLane, type BoardTask, type DueKey } from "../../lib/dashboard";
import type { PrimaryGoal } from "../../lib/dashboardApi";

// Helper: mapping ApiTask + projectMap -> BoardTask (sesuai kegunaan TasksView)
function formatDueTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function mapApiTaskToBoard(task: ApiTask, projectName: string | null, goalName: string | null): BoardTask {
  const isCompleted = task.status === "completed";
  const due = task.due_date ? new Date(task.due_date) : null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = due ? new Date(due.getFullYear(), due.getMonth(), due.getDate()) : null;

  let lane: BoardLane = "upcoming";
  let dueLabel = "No due date";
  let dueTone: BoardTask["dueTone"] = "muted";
  let dueKey: DueKey = "week";
  let completedLabel: string | null = null;

  if (isCompleted) {
    lane = "completed";
    dueTone = "success";
    dueLabel = "Completed";
    completedLabel = "Completed";
    dueKey = "week";
    if (due) {
      const updated = new Date(task.updated_at);
      const updStart = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate());
      if (updStart.getTime() === todayStart.getTime()) completedLabel = "Completed today";
      else if (updated > todayStart) completedLabel = "Completed";
      else completedLabel = "Completed";
    }
  } else if (due && dueStart) {
    const time = formatDueTime(due);
    const diffDays = Math.round((dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      lane = "overdue";
      dueTone = "danger";
      dueLabel = "Overdue";
      dueKey = "overdue";
      if (diffDays === -1) dueLabel = `Yesterday (Overdue), ${time}`;
      else dueLabel = `Overdue ${Math.abs(diffDays)}d, ${time}`;
    } else if (diffDays === 0) {
      lane = "overdue";
      dueTone = "primary";
      dueLabel = `Today, ${time}`;
      dueKey = "today";
    } else if (diffDays === 1) {
      lane = "in-progress";
      dueTone = "muted";
      dueLabel = `Tomorrow, ${time}`;
      dueKey = "week";
    } else if (diffDays <= 7) {
      lane = "upcoming";
      dueTone = "muted";
      dueLabel = `${due.toLocaleDateString("en-US", { weekday: "long" })}, ${time}`;
      dueKey = "week";
    } else {
      lane = "upcoming";
      dueTone = "muted";
      dueLabel = `${due.toLocaleDateString()}, ${time}`;
      dueKey = "week";
    }
  } else {
    lane = task.status === "in_progress" ? "in-progress" : "upcoming";
    dueTone = "muted";
    dueLabel = "No due date";
    dueKey = "week";
  }

  // status in_progress selalu di kolom In Progress (minta user), due date tetap dipakai untuk dueKey/filter + warna due
  if (!isCompleted && task.status === "in_progress") {
    lane = "in-progress";
  }

  const tag = (projectName as BoardTask["tag"]) || "Tech Prep";
  const estimateMinutes = task.estimated_minutes && task.estimated_minutes > 0 ? task.estimated_minutes : 30;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    tag,
    priority: task.priority as BoardTask["priority"],
    status: task.status as BoardTask["status"],
    dueDateISO: task.due_date,
    lane,
    prevLane: null,
    dueLabel,
    dueTone,
    dueKey,
    estimate: formatEstimateMinutes(estimateMinutes),
    estimateMinutes,
    progress: task.status === "in_progress" ? 35 : null,
    completedLabel,
    projectId: task.project_id ?? null,
    goalIds: task.goal_ids ?? [],
    projectName,
    goalName,
    assigneeId: task.assignee_id ?? null,
    assigneeName: task.assignee?.username ?? null,
  };
}

function dueKeyToDate(dueKey: DueKey): string | null {
  const now = new Date();
  if (dueKey === "today") return now.toISOString();
  if (dueKey === "week") {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString();
  }
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

type BoardView = "list" | "board";
type StatusFilter = "all" | BoardTask["status"];
type PriorityFilter = "all" | BoardTask["priority"];
type DateFilter = "all" | DueKey;
type SortKey = "due" | "priority" | "recent";

const STATUS_LABEL: Record<BoardTask["status"], string> = {
  not_started: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_STYLE: Record<BoardTask["status"], string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-blue-50 text-blue-500",
  completed: "bg-emerald-50 text-emerald-600",
};

const PRIORITY_LABEL: Record<BoardTask["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_STYLE: Record<BoardTask["priority"], string> = {
  high: "bg-red-50 text-red-500",
  medium: "bg-orange-50 text-orange-500",
  low: "bg-emerald-50 text-emerald-500",
};

function shortDue(t: BoardTask): string {
  if (!t.dueDateISO) return "No date";
  if (t.status === "completed") {
    return new Date(t.dueDateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (t.dueKey === "today") return "Today";
  if (t.dueKey === "overdue") return "Overdue";
  const diff = Math.round(
    (new Date(new Date(t.dueDateISO).toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) /
      86400000
  );
  if (diff === 1) return "Tomorrow";
  return new Date(t.dueDateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TasksView() {
  const { active, myRole, perms, permsLoading } = useDashboard();
  const readable = canReadPerm(myRole, perms, "task");
  const editable = canEditPerm(myRole, perms, "task");
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  const [assignees, setAssignees] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<BoardView>("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);

  const activeId = active?.id;

  const fetchData = async (withLoading = true) => {
    if (!active) return;
    if (withLoading) setLoading(true);
    try {
      const [apiTasks, apiProjects, apiGoals, apiAssignees] = await Promise.all([
        fetchTasks(active.id).catch(() => [] as ApiTask[]),
        fetchProjects(active.id).catch(() => [] as ApiProject[]),
        fetchGoals(active.id).catch(() => [] as PrimaryGoal[]),
        fetchAssignableMembers(active.id, "task").catch(() => [] as AssignableMember[]),
      ]);
      const projMap = new Map(apiProjects.map((p) => [p.id, p.project_name]));
      const goalMap = new Map(apiGoals.map((g) => [g.id, g.title]));
      const mapped = (apiTasks ?? []).map((t) =>
        mapApiTaskToBoard(
          t,
          t.project_id ? (projMap.get(t.project_id) ?? null) : null,
          t.goal_ids?.[0] ? (goalMap.get(t.goal_ids[0]) ?? null) : null
        )
      );
      setTasks(mapped);
      setProjects(apiProjects ?? []);
      setGoals(apiGoals ?? []);
      setAssignees(apiAssignees ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    Promise.all([
      fetchTasks(activeId).catch(() => [] as ApiTask[]),
      fetchProjects(activeId).catch(() => [] as ApiProject[]),
      fetchGoals(activeId).catch(() => [] as PrimaryGoal[]),
      fetchAssignableMembers(activeId, "task").catch(() => [] as AssignableMember[]),
    ])
      .then(([apiTasks, apiProjects, apiGoals, apiAssignees]) => {
        if (cancelled) return;
        const projMap = new Map(apiProjects.map((p) => [p.id, p.project_name]));
        const goalMap = new Map(apiGoals.map((g) => [g.id, g.title]));
        const mapped = (apiTasks ?? []).map((t) =>
          mapApiTaskToBoard(
            t,
            t.project_id ? (projMap.get(t.project_id) ?? null) : null,
            t.goal_ids?.[0] ? (goalMap.get(t.goal_ids[0]) ?? null) : null
          )
        );
        setTasks(mapped);
        setProjects(apiProjects ?? []);
        setGoals(apiGoals ?? []);
        setAssignees(apiAssignees ?? []);
        setError(null);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Failed to load tasks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (ev.type === "task_created" || ev.type === "task_toggled" || ev.type === "task_updated" || ev.type === "task_deleted" || ev.type === "goals_refresh") {
        void fetchData(false);
      }
    });
    return () => disconnect();
  }, [activeId]);

  function laneForStatus(status: BoardTask["status"], dueKey: DueKey): BoardLane {
    if (status === "completed") return "completed";
    if (status === "in_progress") return "in-progress";
    return "upcoming";
  }

  async function toggleTask(id: number) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const prevTasks = tasks;
    const nextStatus: BoardTask["status"] = target.status === "completed" ? "not_started" : "completed";
    const nextLane = laneForStatus(nextStatus, target.dueKey);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (nextStatus === "completed") {
          return {
            ...t,
            status: nextStatus,
            lane: "completed" as BoardLane,
            prevLane: t.lane,
            prevDueTone: t.dueTone,
            completedLabel: "Completed today",
            dueTone: "success" as BoardTask["dueTone"],
            progress: null,
          };
        }
        return {
          ...t,
          status: nextStatus,
          lane: nextLane,
          prevLane: null,
          completedLabel: null,
          dueTone: (t.prevDueTone ?? "muted") as BoardTask["dueTone"],
          prevDueTone: null,
          progress: null,
        };
      })
    );
    try {
      await toggleTaskApi(active.id, id);
      await fetchData();
    } catch (e) {
      console.error("toggle failed", e);
      setTasks(prevTasks);
    }
  }

  async function handleStatusChange(id: number, status: BoardTask["status"]) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target || target.status === status) return;
    const prevTasks = tasks;
    const nextLane = laneForStatus(status, target.dueKey);
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== id
          ? t
          : {
              ...t,
              status,
              lane: nextLane,
              prevLane: status === "completed" ? t.lane : null,
              completedLabel: status === "completed" ? "Completed today" : null,
              dueTone: (status === "completed" ? "success" : "muted") as BoardTask["dueTone"],
              progress: status === "in_progress" ? 35 : null,
            }
      )
    );
    try {
      await updateTaskApi(active.id, id, { status });
      await fetchData();
    } catch (e) {
      console.error("update status failed", e);
      setTasks(prevTasks);
    }
  }

  async function handlePriorityChange(id: number, priority: BoardTask["priority"]) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target || target.priority === priority) return;
    const prevTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id !== id ? t : { ...t, priority }))
    );
    try {
      await updateTaskApi(active.id, id, { priority });
      await fetchData();
    } catch (e) {
      console.error("update priority failed", e);
      setTasks(prevTasks);
    }
  }

  async function handleDueChange(id: number, dueDateISO: string | null) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const cur = target.dueDateISO ? new Date(target.dueDateISO).getTime() : null;
    const next = dueDateISO ? new Date(dueDateISO).getTime() : null;
    if (next === cur) return;
    try {
      if (dueDateISO == null) {
        await updateTaskApi(active.id, id, { due_date: null, clear_due_date: true });
      } else {
        await updateTaskApi(active.id, id, { due_date: dueDateISO });
      }
      await fetchData();
    } catch (e) {
      console.error("update due date failed", e);
    }
  }

  async function handleAssigneeChange(id: number, assigneeId: number | null) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target || (target.assigneeId ?? null) === assigneeId) return;
    const prevTasks = tasks;
    const nextName =
      assigneeId != null
        ? (assignees.find((a) => a.user_id === assigneeId)?.username ?? target.assigneeName)
        : null;
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== id ? t : { ...t, assigneeId, assigneeName: nextName }
      )
    );
    try {
      await updateTaskApi(
        active.id,
        id,
        assigneeId == null ? { clear_assignee_id: true } : { assignee_id: assigneeId }
      );
      await fetchData();
    } catch (e) {
      console.error("update assignee failed", e);
      setTasks(prevTasks);
    }
  }

  async function handleEditSave(input: EditTaskInput) {
    if (!active || !editingTask) return;
    const target = editingTask;
    const targetId = target.id;
    // aturan edit tasks: modal hanya untuk title, estimate, goal, project;
    // due date, status, priority, assignee lewat dropdown inline
    const payload: Partial<CreateTaskPayload> = {};
    if (input.title !== target.title) payload.title = input.title;
    if (input.estimateMinutes !== target.estimateMinutes) {
      payload.estimated_minutes = input.estimateMinutes;
    }
    const curProj = target.projectId ?? null;
    if (input.projectId !== curProj) {
      if (input.projectId == null) payload.clear_project_id = true;
      else payload.project_id = input.projectId;
    }
    const curGoal = target.goalIds?.[0] ?? null;
    if (input.goalId !== curGoal) {
      if (input.goalId == null) payload.clear_goal_id = true;
      else payload.goal_id = input.goalId;
    }
    setEditingTask(null);
    if (Object.keys(payload).length === 0) return;
    const prevTasks = tasks;
    const projName =
      input.projectId != null
        ? (projects.find((p) => p.id === input.projectId)?.project_name ?? null)
        : null;
    const nextGoalName =
      input.goalId != null
        ? (goals.find((g) => g.id === input.goalId)?.title ?? null)
        : null;
    setTasks((prev) =>
      prev.map((t) =>
        t.id !== targetId
          ? t
          : {
              ...t,
              title: input.title,
              estimateMinutes: input.estimateMinutes,
              estimate: formatEstimateMinutes(input.estimateMinutes),
              projectId: input.projectId,
              goalIds: input.goalId != null ? [input.goalId] : [],
              projectName: projName,
              goalName: nextGoalName,
              ...(projName ? { tag: projName as BoardTask["tag"] } : {}),
            }
      )
    );
    try {
      await updateTaskApi(active.id, targetId, payload);
      await fetchData();
    } catch (e) {
      console.error("update task failed", e);
      setTasks(prevTasks);
    }
  }

  async function handleDelete(id: number) {
    if (!active) return;
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTaskApi(active.id, id);
      await fetchData();
    } catch (e) {
      console.error("delete task failed", e);
      setTasks(prevTasks);
    }
  }

  async function addTask(input: NewBoardTaskInput) {
    if (!active) return;
    const dueDate = input.dueToday ? new Date().toISOString() : dueKeyToDate(input.dueKey);
    // project dan goal dipisah
    const projectId = input.projectId;
    const goalId = input.goalId;
    try {
      await createTask(active.id, {
        title: input.title,
        priority: input.priority,
        status: "not_started",
        due_date: dueDate,
        estimated_minutes: input.estimateMinutes ?? 30,
        project_id: projectId,
        goal_id: goalId,
        assignee_id: input.assigneeId,
        description: null,
      });
      await fetchData();
    } catch (e) {
      console.error("create task failed", e);
      const lane: BoardLane = input.dueToday ? "overdue" : "upcoming";
      const fallbackMinutes = input.estimateMinutes ?? 30;
      setTasks((prev) => [
        {
          id: Date.now(),
          title: input.title,
          description: null,
          tag: (input.project as BoardTask["tag"]) || "Tech Prep",
          priority: input.priority,
          status: "not_started" as BoardTask["status"],
          dueDateISO: dueDate,
          lane,
          prevLane: null,
          dueLabel: input.due,
          dueTone: input.dueToday ? "primary" : "muted",
          dueKey: input.dueKey,
          estimate: formatEstimateMinutes(fallbackMinutes),
          estimateMinutes: fallbackMinutes,
          progress: null,
          completedLabel: null,
          projectId: input.projectId,
          goalIds: input.goalId != null ? [input.goalId] : [],
          projectName: input.project,
          goalName: input.goal,
          assigneeId: input.assigneeId,
          assigneeName: input.assigneeId != null
            ? (assignees.find((a) => a.user_id === input.assigneeId)?.username ?? null)
            : null,
        },
        ...prev,
      ]);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setDate("all");
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (date !== "all" && t.dueKey !== date) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    if (sort === "due") {
      sorted.sort((a, b) => {
        const at = a.dueDateISO ? new Date(a.dueDateISO).getTime() : Infinity;
        const bt = b.dueDateISO ? new Date(b.dueDateISO).getTime() : Infinity;
        return at - bt;
      });
    } else if (sort === "priority") {
      const rank: Record<BoardTask["priority"], number> = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => rank[a.priority] - rank[b.priority]);
    } else {
      sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [tasks, search, status, priority, date, sort]);

  const upcoming = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "completed" && t.dueDateISO)
        .sort((a, b) => +new Date(a.dueDateISO as string) - +new Date(b.dueDateISO as string))
        .slice(0, 4),
    [tasks]
  );

  const todayStats = useMemo(() => {
    const dueToday = tasks.filter((t) => t.status !== "completed" && t.dueKey === "today");
    const completedCount = tasks.filter(
      (t) => t.status === "completed" && t.completedLabel === "Completed today"
    ).length;
    const total = dueToday.length + completedCount;
    return { total, completed: completedCount, remaining: dueToday.length };
  }, [tasks]);

  const todayProgress = todayStats.total
    ? Math.round((todayStats.completed / todayStats.total) * 100)
    : 0;

  const boardColumns: BoardTask["status"][] = ["not_started", "in_progress", "completed"];
  const boardTitle: Record<BoardTask["status"], string> = {
    not_started: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
  };
  const boardDot: Record<BoardTask["status"], string> = {
    not_started: "bg-slate-400",
    in_progress: "bg-blue-500",
    completed: "bg-emerald-500",
  };

  if (!permsLoading && !readable) {
    return <AccessDenied resource="Tasks" />;
  }

  if (loading || permsLoading) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="h-24 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white p-5 shadow-sm" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Gagal load tasks</p>
          <p className="text-xs text-red-500">{error}</p>
          <button onClick={() => void fetchData()} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
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
            <CheckCircle2 size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Organize your work and keep moving forward.
            </p>
          </div>
        </div>
        {editable && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Plus size={18} />
            New Task
          </button>
        )}
      </section>

      {/* TODAY + UPCOMING */}
      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays size={19} className="text-blue-500" />
            <h2 className="font-bold text-slate-900">Today</h2>
          </div>
          <div className="mt-5">
            <p className="text-3xl font-bold text-slate-900">{todayStats.total}</p>
            <p className="mt-1 text-xs text-slate-400">tasks scheduled for today</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${todayProgress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>{todayStats.completed} completed</span>
              <span>{todayStats.remaining} remaining</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Upcoming Tasks</h2>
          </div>
          <div className="mt-5 space-y-4">
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-400">No dated tasks ahead.</p>
            )}
            {upcoming.map((t) => (
              <div key={t.id} className="flex gap-3">
                <div className="mt-0.5">
                  {t.status === "completed" ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} className="text-slate-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-700">{t.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{shortDue(t)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate text-[10px] text-slate-400">{active?.name ?? "Workspace"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
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
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityFilter)}
                aria-label="Filter by priority"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Status</option>
                <option value="not_started">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={date}
                onChange={(e) => setDate(e.target.value as DateFilter)}
                aria-label="Filter by due date"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today</option>
                <option value="week">This Week</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            {(search || status !== "all" || priority !== "all" || date !== "all") && (
              <button
                onClick={resetFilters}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Reset
              </button>
            )}
            <div className="ml-2 flex rounded-xl border border-slate-200 p-1">
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`rounded-lg p-2 transition ${view === "list" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <List size={17} />
              </button>
              <button
                onClick={() => setView("board")}
                aria-label="Board view"
                className={`rounded-lg p-2 transition ${view === "board" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ALL TASKS (full width) */}
      <section>
        <div>
          {view === "list" ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">All Tasks</h2>
                    <p className="mt-1 text-xs text-slate-400">{visible.length} tasks found</p>
                  </div>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      aria-label="Sort tasks"
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
                    >
                      <option value="due">Sort by: Due Date</option>
                      <option value="priority">Sort by: Priority</option>
                      <option value="recent">Sort by: Recent</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {visible.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Search size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">No tasks found</p>
                    <p className="mt-1 text-xs text-slate-400">Try another search or filter.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-400">
                        <th className="px-5 py-4 font-medium">Task</th>
                        <th className="px-4 py-4 font-medium">Priority</th>
                        <th className="px-4 py-4 font-medium">Status</th>
                        <th className="px-4 py-4 font-medium">Due</th>
                        <th className="px-4 py-4 font-medium">Assignee</th>
                        <th className="w-12 px-4 py-4"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((t) => {
                        const done = t.status === "completed";
                        return (
                          <tr key={t.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleTask(t.id)}
                                  disabled={!editable}
                                  aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                                  className="shrink-0 disabled:cursor-not-allowed"
                                >
                                  {done ? (
                                    <CheckCircle2 size={19} className="text-emerald-500" />
                                  ) : (
                                    <Circle size={19} className="text-slate-300 transition hover:text-blue-500" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <p className={`truncate text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                    {t.title}
                                  </p>
                                  <TaskLinks projectName={null} goalName={t.goalName} className="mt-1" />
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {editable ? (
                                <InlineSelect
                                  value={t.priority}
                                  options={[
                                    { value: "high", label: "High", dot: "bg-red-500" },
                                    { value: "medium", label: "Medium", dot: "bg-orange-500" },
                                    { value: "low", label: "Low", dot: "bg-emerald-500" },
                                  ]}
                                  onChange={(v) => void handlePriorityChange(t.id, v as BoardTask["priority"])}
                                  label={`Change priority of ${t.title}`}
                                  buttonClassName={`rounded-full py-1 pl-2.5 pr-1.5 text-[10px] font-medium outline-none transition ${PRIORITY_STYLE[t.priority]}`}
                                />
                              ) : (
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${PRIORITY_STYLE[t.priority]}`}>
                                  {PRIORITY_LABEL[t.priority]}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {editable ? (
                                <InlineSelect
                                  value={t.status}
                                  options={[
                                    { value: "not_started", label: "To Do", dot: "bg-slate-300" },
                                    { value: "in_progress", label: "In Progress", dot: "bg-blue-500" },
                                    { value: "completed", label: "Completed", dot: "bg-emerald-500" },
                                  ]}
                                  onChange={(v) => void handleStatusChange(t.id, v as BoardTask["status"])}
                                  label={`Change status of ${t.title}`}
                                  buttonClassName={`rounded-full py-1 pl-2.5 pr-1.5 text-[10px] font-medium outline-none transition ${STATUS_STYLE[t.status]}`}
                                />
                              ) : (
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLE[t.status]}`}>
                                  {STATUS_LABEL[t.status]}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                              <DueDateSelect
                                valueISO={t.dueDateISO ?? null}
                                display={shortDue(t)}
                                onChange={(next) => void handleDueChange(t.id, next)}
                                canEdit={editable}
                                label={`Change due date of ${t.title}`}
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <AssigneeSelect
                                assigneeId={t.assigneeId ?? null}
                                assigneeName={t.assigneeName}
                                assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
                                onChange={(next) => void handleAssigneeChange(t.id, next)}
                                canEdit={editable}
                                label={`Change assignee of ${t.title}`}
                              />
                            </td>
                            <td className="px-4 py-4">
                              {editable && (
                                <RowActionMenu
                                  label={t.title}
                                  onEdit={() => setEditingTask(t)}
                                  onDelete={() => void handleDelete(t.id)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {boardColumns.map((col) => {
                const columnTasks = visible.filter((t) => t.status === col);
                return (
                  <div key={col} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${boardDot[col]}`} />
                        <h2 className="text-sm font-bold text-slate-900">{boardTitle[col]}</h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {columnTasks.map((t) => {
                        const done = t.status === "completed";
                        return (
                          <div
                            key={t.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2">
                              {editable ? (
                                <InlineSelect
                                  value={t.priority}
                                  options={[
                                    { value: "high", label: "High", dot: "bg-red-500" },
                                    { value: "medium", label: "Medium", dot: "bg-orange-500" },
                                    { value: "low", label: "Low", dot: "bg-emerald-500" },
                                  ]}
                                  onChange={(v) => void handlePriorityChange(t.id, v as BoardTask["priority"])}
                                  label={`Change priority of ${t.title}`}
                                  buttonClassName={`rounded-full px-2.5 py-1 text-[10px] font-medium outline-none transition ${PRIORITY_STYLE[t.priority]}`}
                                />
                              ) : (
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${PRIORITY_STYLE[t.priority]}`}>
                                  {PRIORITY_LABEL[t.priority]}
                                </span>
                              )}
                              {editable && (
                                <RowActionMenu
                                  label={t.title}
                                  onEdit={() => setEditingTask(t)}
                                  onDelete={() => void handleDelete(t.id)}
                                />
                              )}
                            </div>
                            <div className="mt-3 flex items-start gap-2">
                              <button
                                onClick={() => toggleTask(t.id)}
                                disabled={!editable}
                                aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                                className="mt-0.5 shrink-0 disabled:cursor-not-allowed"
                              >
                                {done ? (
                                  <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : (
                                  <Circle size={18} className="text-slate-300 transition hover:text-blue-500" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <h3 className={`truncate text-sm font-semibold ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                  {t.title}
                                </h3>
                                {t.description && (
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <DueDateSelect
                                valueISO={t.dueDateISO ?? null}
                                display={shortDue(t)}
                                onChange={(next) => void handleDueChange(t.id, next)}
                                canEdit={editable}
                                label={`Change due date of ${t.title}`}
                              />
                              <TaskLinks
                                projectName={t.projectName}
                                goalName={null}
                                className="justify-end [&>span]:max-w-24"
                              />
                            </div>
                            {t.goalName && (
                              <div className="mt-1.5 flex justify-end">
                                <TaskLinks projectName={null} goalName={t.goalName} className="[&>span]:max-w-24" />
                              </div>
                            )}
                            <div className="mt-1.5 flex justify-start">
                              <AssigneeSelect
                                assigneeId={t.assigneeId ?? null}
                                assigneeName={t.assigneeName}
                                assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
                                onChange={(next) => void handleAssigneeChange(t.id, next)}
                                canEdit={editable}
                                label={`Change assignee of ${t.title}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {editable && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-xs text-slate-400 transition hover:border-blue-300 hover:text-blue-500"
                        >
                          <Plus size={15} />
                          Add Task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* KEEP GOING (full width) */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-bold text-slate-800">Keep Going!</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Every completed task brings you one step closer to your goal.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-block shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600"
          >
            View Progress →
          </Link>
        </div>
      </section>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
        projects={projects.map((p) => ({ id: p.id, name: p.project_name }))}
        goals={goals.map((g) => ({ id: g.id, name: g.title }))}
        assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
        canSelectProject={canEditPerm(myRole, perms, "project")}
        canSelectGoal={canEditPerm(myRole, perms, "goal")}
      />
      {editingTask && (
        <EditTaskModal
          key={editingTask.id}
          task={editingTask}
          projects={projects.map((p) => ({ id: p.id, name: p.project_name }))}
          goals={goals.map((g) => ({ id: g.id, name: g.title }))}
          onClose={() => setEditingTask(null)}
          onSave={handleEditSave}
          canSelectProject={canEditPerm(myRole, perms, "project")}
          canSelectGoal={canEditPerm(myRole, perms, "goal")}
        />
      )}
    </div>
  );
}
