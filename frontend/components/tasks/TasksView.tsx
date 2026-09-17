/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import TasksHeader, { type BoardView } from "./TasksHeader";
import TasksStats from "./TasksStats";
import TasksFilterBar, {
  type DateFilter,
  type PriorityFilter,
} from "./TasksFilterBar";
import TaskBoard from "./TaskBoard";
import TaskListView from "./TaskListView";
import NewTaskModal, { type NewBoardTaskInput } from "./NewTaskModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import { fetchTasks, fetchProjects, fetchGoals, createTask, toggleTaskApi, updateTaskApi, type ApiTask, type ApiProject } from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";
import { formatEstimateMinutes, type BoardLane, type BoardTask, type DueKey } from "../../lib/dashboard";
import type { PrimaryGoal } from "../../lib/dashboardApi";

// Helper: mapping ApiTask + projectMap -> BoardTask (sesuai kegunaan TasksView)
function formatDueTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function mapApiTaskToBoard(task: ApiTask, projectName: string | null): BoardTask {
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

export default function TasksView() {
  const { active } = useDashboard();
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<BoardView>("board");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const activeId = active?.id;

  const fetchData = async (withLoading = true) => {
    if (!active) return;
    if (withLoading) setLoading(true);
    try {
      const [apiTasks, apiProjects, apiGoals] = await Promise.all([
        fetchTasks(active.id).catch(() => [] as ApiTask[]),
        fetchProjects(active.id).catch(() => [] as ApiProject[]),
        fetchGoals(active.id).catch(() => [] as PrimaryGoal[]),
      ]);
      const projMap = new Map(apiProjects.map((p) => [p.id, p.project_name]));
      const mapped = (apiTasks ?? []).map((t) => mapApiTaskToBoard(t, t.project_id ? (projMap.get(t.project_id) ?? null) : null));
      setTasks(mapped);
      setProjects(apiProjects ?? []);
      setGoals(apiGoals ?? []);
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
    ])
      .then(([apiTasks, apiProjects, apiGoals]) => {
        if (cancelled) return;
        const projMap = new Map(apiProjects.map((p) => [p.id, p.project_name]));
        const mapped = (apiTasks ?? []).map((t) => mapApiTaskToBoard(t, t.project_id ? (projMap.get(t.project_id) ?? null) : null));
        setTasks(mapped);
        setProjects(apiProjects ?? []);
        setGoals(apiGoals ?? []);
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
      if (ev.type === "task_created" || ev.type === "task_toggled" || ev.type === "task_updated" || ev.type === "goals_refresh") {
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
    setTasks((prev) => prev.map((t) => (t.id !== id ? t : { ...t, priority })));
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
    try {
      if (dueDateISO === null) {
        await updateTaskApi(active.id, id, { due_date: null, clear_due_date: true });
      } else {
        await updateTaskApi(active.id, id, { due_date: dueDateISO });
      }
      await fetchData();
    } catch (e) {
      console.error("update due date failed", e);
    }
  }

  async function handleEstimateChange(id: number, minutes: number) {
    if (!active) return;
    const target = tasks.find((t) => t.id === id);
    if (!target || target.estimateMinutes === minutes) return;
    const prevTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id !== id ? t : { ...t, estimateMinutes: minutes, estimate: formatEstimateMinutes(minutes) }))
    );
    try {
      await updateTaskApi(active.id, id, { estimated_minutes: minutes });
      await fetchData();
    } catch (e) {
      console.error("update estimate failed", e);
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
        },
        ...prev,
      ]);
    }
  }

  function resetFilters() {
    setPriority("all");
    setDate("all");
  }

  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (priority !== "all" && t.priority !== priority) return false;
        if (date !== "all" && t.dueKey !== date) return false;
        return true;
      }),
    [tasks, priority, date]
  );

  if (loading) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-5">
        <TasksHeader view={view} onViewChange={setView} onNewTask={() => setModalOpen(true)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white p-4 shadow-sm">
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-3 h-6 w-1/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-5">
        <TasksHeader view={view} onViewChange={setView} onNewTask={() => setModalOpen(true)} />
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
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <TasksHeader
        view={view}
        onViewChange={setView}
        onNewTask={() => setModalOpen(true)}
      />
      <TasksStats tasks={tasks} />
      <TasksFilterBar
        priority={priority}
        onPriorityChange={setPriority}
        date={date}
        onDateChange={setDate}
        onReset={resetFilters}
      />
      {view === "board" ? (
        <TaskBoard tasks={visible} onToggle={toggleTask} onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} onDueChange={handleDueChange} onEstimateChange={handleEstimateChange} />
      ) : (
        <TaskListView tasks={visible} onToggle={toggleTask} onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} onDueChange={handleDueChange} onEstimateChange={handleEstimateChange} />
      )}
      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
        projects={projects.map((p) => ({ id: p.id, name: p.project_name }))}
        goals={goals.map((g) => ({ id: g.id, name: g.title }))}
      />
    </div>
  );
}
