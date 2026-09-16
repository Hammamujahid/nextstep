"use client";

import { useEffect, useState } from "react";
import HeroHeader from "./HeroHeader";
import PrimaryGoalCard from "./PrimaryGoalCard";
import MetricsGrid from "./MetricsGrid";
import NextSteps from "./NextSteps";
import ProjectsPanel from "./ProjectsPanel";
import ApplicationsPanel from "./ApplicationsPanel";
import GoalsSnapshot from "./GoalsSnapshot";
import FooterBanner from "./FooterBanner";
import QuickAddModal, { type QuickTaskInput } from "./QuickAddModal";
import {
  toBackendPriority,
  toFrontendPriority,
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
  createTask,
  toggleTaskApi,
  type CreateTaskPayload,
} from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";

function mapApiTask(t: import("../../lib/dashboardApi").ApiTask, projectName: string | null): DashboardTask {
  const status = t.status as DashboardTask["status"];
  const isCompleted = status === "completed";
  const dueDate = t.due_date ? new Date(t.due_date) : null;
  const dueToday = dueDate
    ? new Date().toDateString() === dueDate.toDateString()
    : false;
  let dueLabel = "No due date";
  if (t.due_date) {
    dueLabel = dueToday ? "Due Today" : new Date(t.due_date).toLocaleDateString();
  }
  return {
    id: t.id,
    title: t.title,
    priority: toFrontendPriority(t.priority),
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

export default function DashboardHome() {
  const { profile, active } = useDashboard();
  const username = profile.username;
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [projects, setProjects] = useState<DashboardProject[] | null>(null);
  const [skillTracks, setSkillTracks] = useState<SkillTrack[] | null>(null);
  const [applications, setApplications] = useState<DashboardApplication[] | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasksLoading(true);
    // fetch tasks + projects + goals + applications in parallel - real data, no dummy fallback
    Promise.all([
      fetchTasks(active.id).catch(() => null),
      fetchProjects(active.id).catch(() => null),
      fetchGoals(active.id).catch(() => null),
      fetchApplications(active.id).catch(() => null),
    ]).then(([apiTasks, apiProjects, apiGoals, apiApps]) => {
      if (cancelled) return;
      // tasks: always replace with real data (even empty), no dummy
      if (apiTasks !== null) {
        const projMap = new Map((apiProjects ?? []).map((p) => [p.id, p.project_name]));
        const mapped: DashboardTask[] = apiTasks.map((t) =>
          mapApiTask(t, t.project_id ? (projMap.get(t.project_id) ?? null) : null)
        );
        setTasks(mapped);
      } else {
        setTasks([]);
      }
      setTasksLoading(false);
      // projects: real data only, empty array if none (no dummy)
      if (apiProjects !== null) {
        const mappedProj: DashboardProject[] = apiProjects.map((p) => ({
          id: p.id,
          name: p.project_name,
          description: p.project_description ?? "",
          stage: p.status === "completed" ? "Completed" : p.status === "in_progress" ? "In Progress" : "Planning",
          stageTone: (p.status === "completed" ? "polish" : "progress") as DashboardProject["stageTone"],
          tasksDone: 0,
          tasksTotal: 0,
          status: p.status as DashboardProject["status"],
          updatedAt: p.updated_at,
        }));
        setProjects(mappedProj);
      } else {
        setProjects([]);
      }
      if (apiGoals !== null) {
        const mappedTracks: SkillTrack[] = apiGoals.map((g) => ({
          id: g.id,
          title: g.title,
          detail: g.description ?? "",
          progress: g.progress,
          status: g.status as SkillTrack["status"],
          completedTasks: g.completed_tasks,
          totalTasks: g.total_tasks,
          updatedAt: g.updated_at,
        }));
        setSkillTracks(mappedTracks);
      } else {
        setSkillTracks([]);
      }
      if (apiApps !== null) {
        const statusMap: Record<string, DashboardApplication["statusTone"]> = {
          wishlist: "submitted",
          applied: "submitted",
          interviewing: "interview",
          offered: "final",
          rejected: "review",
        };
        const mappedApps: DashboardApplication[] = apiApps.map((a) => ({
          id: a.id,
          company: a.company_name,
          role: a.job_title,
          status: a.status,
          statusTone: statusMap[a.status] ?? "submitted",
          applied: new Date(a.created_at).toLocaleDateString(),
          note: a.status,
          noteTone: a.status === "offered" ? "emerald" : a.status === "interviewing" ? "sky" : "slate",
          updatedAt: a.updated_at,
        }));
        setApplications(mappedApps);
      } else {
        setApplications([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  // SSE realtime untuk progress bar (goal) dan NextSteps
  useEffect(() => {
    if (!active) return;
    console.log("[DashboardHome] SSE subscribe", active.id);
    const disconnect = connectWorkspaceEvents(active.id, (ev) => {
      console.log("[DashboardHome SSE event]", ev);
      if (ev.type === "goals_refresh" || ev.type === "goal_progress" || ev.type === "task_toggled" || ev.type === "task_created" || ev.type === "goal_created") {
        // update skillTracks (GoalsSnapshot) via fetchGoals
        fetchGoals(active.id)
          .then((data) => {
            if (data) {
              const mappedTracks: SkillTrack[] = data.map((g) => ({
                id: g.id,
                title: g.title,
                detail: g.description ?? "",
                progress: g.progress,
                status: g.status as SkillTrack["status"],
                completedTasks: g.completed_tasks,
                totalTasks: g.total_tasks,
                updatedAt: g.updated_at,
              }));
              setSkillTracks(mappedTracks);
            }
          })
          .catch(() => {});
        // update tasks (NextSteps) via fetch
        fetchTasks(active.id)
          .then((apiTasks) => {
            if (!apiTasks) return;
            // fetch projects untuk mapping nama
            fetchProjects(active.id)
              .then((apiProjects) => {
                const projMap = new Map((apiProjects ?? []).map((p) => [p.id, p.project_name]));
                const mapped: DashboardTask[] = apiTasks.map((t) =>
                  mapApiTask(t, t.project_id ? (projMap.get(t.project_id) ?? null) : null)
                );
                setTasks(mapped);
              })
              .catch(() => {
                const mapped: DashboardTask[] = apiTasks.map((t) => mapApiTask(t, null));
                setTasks(mapped);
              });
          })
          .catch(() => {});
      }
    });
    return () => disconnect();
  }, [active]);

  async function toggleTask(id: number) {
    if (!active) return;
    const prevTasks = tasks;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextStatus: DashboardTask["status"] = target.status === "completed" ? "not_started" : "completed";
    const nextDone = nextStatus === "completed";
    const now = new Date().toISOString();
    // optimistic update
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
      // revert on failure
      console.error("toggle task failed", e);
      setTasks(prevTasks);
    }
  }

  async function addTask(input: QuickTaskInput) {
    if (!active) return;
    // map priority & due date to backend payload
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
    // resolve projectId: prefer direct projectId from modal, fallback to lookup
    let projectId: number | null = input.projectId ?? null;
    let projectName: string | null = input.project ?? null;
    if (projectId === null && input.project && projects && projects.length > 0) {
      const found = projects.find((p) => p.name === input.project);
      if (found) {
        projectId = found.id;
        projectName = found.name;
      }
    }
    // resolve goalId: prefer direct goalId from modal
    let goalId: number | null = input.goalId ?? null;
    let goalName: string | null = input.goal ?? null;
    if (goalId === null && input.goal && skillTracks && skillTracks.length > 0) {
      const foundGoal = skillTracks.find((g) => g.title === input.goal);
      if (foundGoal) {
        goalId = foundGoal.id;
        goalName = foundGoal.title;
      }
    }
    const payload: CreateTaskPayload = {
      title: input.title,
      priority: backendPriority,
      status: "not_started",
      due_date: dueDateISO,
      project_id: projectId,
      goal_id: goalId,
    };
    try {
      const created = await createTask(active.id, payload);
      const mapped = mapApiTask(created, projectName);
      setTasks((prev) => [mapped, ...prev]);
    } catch (e) {
      console.error("create task failed", e);
      // fallback optimistic local (agar UI tetap responsif jika backend belum siap)
      const now = new Date().toISOString();
      const fallback: DashboardTask = {
        id: Date.now(),
        title: input.title,
        priority: input.priority,
        status: "not_started",
        due: input.due,
        dueToday: input.dueToday,
        dueDate: dueDateISO,
        project: projectName,
        projectId,
        done: false,
        isCompleted: false,
        updatedAt: now,
        createdAt: now,
      };
      setTasks((prev) => [fallback, ...prev]);
    }
  }

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      <HeroHeader username={username} onNewTask={() => setQuickAddOpen(true)} />
      <PrimaryGoalCard />
      <MetricsGrid />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {tasksLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-12 w-full rounded bg-slate-100" />
                <div className="h-12 w-full rounded bg-slate-100" />
              </div>
            </div>
          ) : (
            <NextSteps
              tasks={tasks}
              onToggle={toggleTask}
              onAdd={() => setQuickAddOpen(true)}
            />
          )}
          <ProjectsPanel tasks={tasks} projects={projects ?? []} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ApplicationsPanel applications={applications ?? []} />
          <GoalsSnapshot tracks={skillTracks ?? []} />
        </div>
      </div>

      <FooterBanner />

      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={addTask}
        projects={projects ?? []}
        goals={(skillTracks ?? []).map((g) => ({ id: g.id, name: g.title }))}
      />
    </div>
  );
}
