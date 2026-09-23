import { apiFetch } from "./apiClient";

export type ApiAssignee = {
  id: number;
  username: string;
  email: string;
};

export type AssignableMember = {
  user_id: number;
  username: string;
  email: string;
  member_role: string;
  permission: string;
};

export async function fetchAssignableMembers(
  workspaceId: number,
  resource: "project" | "task" | "goal" | "job_application"
): Promise<AssignableMember[]> {
  return authGet<AssignableMember[]>(
    `/workspaces/${workspaceId}/assignable?resource=${resource}`
  );
}

export type PrimaryGoal = {
  id: number;
  workspace_id: number;
  title: string;
  description: string | null;
  status: string;
  assignee_id: number | null;
  assignee?: ApiAssignee | null;
  created_at: string;
  updated_at: string;
  total_projects: number;
  completed_projects: number;
  total_tasks: number;
  completed_tasks: number;
  total_requirements: number;
  completed_requirements: number;
  progress: number;
};

export async function fetchPrimaryGoal(
  workspaceId: number
): Promise<PrimaryGoal | null> {
  try {
    const json = (await apiFetch(
      `/workspaces/${workspaceId}/primary-goal`
    )) as { data: PrimaryGoal | null };
    return json.data;
  } catch (e: unknown) {
    const m = e as { message?: string };
    throw new Error(m.message || "Failed to load primary goal");
  }
}

export type DashboardMetrics = {
  goals: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
    archived: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    // deprecated
    not_started: number;
    in_progress: number;
    archived: number;
  };
  projects: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
    archived: number;
  };
  applications: {
    total: number;
    wishlist: number;
    applied: number;
    under_review: number;
    interviewing: number;
    offered: number;
    rejected: number;
  };
};

export async function fetchMetrics(workspaceId: number): Promise<DashboardMetrics> {
  try {
    const json = (await apiFetch(
      `/workspaces/${workspaceId}/metrics`
    )) as { data: DashboardMetrics };
    return json.data;
  } catch (e: unknown) {
    const m = e as { message?: string };
    throw new Error(m.message || "Failed to load metrics");
  }
}

async function authGet<T>(path: string): Promise<T> {
  try {
    const json = (await apiFetch(path)) as { data: T };
    return json.data;
  } catch (e: unknown) {
    const m = e as { message?: string };
    throw new Error(m.message || `Failed to load ${path}`);
  }
}

async function authMutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  try {
    const json = (await apiFetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })) as { data: T };
    return json.data;
  } catch (e: unknown) {
    const m = e as { message?: string; details?: string[] };
    const msg =
      m.message ||
      (Array.isArray(m.details) ? m.details.join(", ") : "") ||
      `Failed to ${method} ${path}`;
    throw new Error(msg);
  }
}

export type ApiTask = {
  id: number;
  workspace_id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  due_date: string | null;
  estimated_minutes: number;
  goal_ids?: number[] | null;
  assignee_id: number | null;
  assignee?: ApiAssignee | null;
  created_at: string;
  updated_at: string;
};

export type ApiProject = {
  id: number;
  workspace_id: number;
  project_name: string;
  project_description: string | null;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
  assignee_id: number | null;
  assignee?: ApiAssignee | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "under_review"
  | "interviewing"
  | "offered"
  | "rejected";

export type ApiApplication = {
  id: number;
  workspace_id: number;
  job_title: string;
  company_name: string;
  status: ApplicationStatus;
  due_date: string | null;
  job_url: string | null;
  assignee_id: number | null;
  assignee?: ApiAssignee | null;
  created_at: string;
  updated_at: string;
};

export function fetchTasks(workspaceId: number) {
  return authGet<ApiTask[]>(`/workspaces/${workspaceId}/tasks`);
}
export function fetchProjects(workspaceId: number) {
  return authGet<ApiProject[]>(`/workspaces/${workspaceId}/projects`);
}
export function fetchGoals(workspaceId: number) {
  return authGet<PrimaryGoal[]>(`/workspaces/${workspaceId}/goals`);
}
export function fetchGoalTasks(workspaceId: number, goalId: number) {
  return authGet<ApiTask[]>(`/workspaces/${workspaceId}/goals/${goalId}/tasks`);
}
export function fetchGoalProjects(workspaceId: number, goalId: number) {
  return authGet<ApiProject[]>(`/workspaces/${workspaceId}/goals/${goalId}/projects`);
}
export function fetchApplications(workspaceId: number) {
  return authGet<ApiApplication[]>(`/workspaces/${workspaceId}/applications`);
}

export type CreateApplicationPayload = {
  job_title: string;
  company_name: string;
  status?: ApplicationStatus;
  due_date?: string | null;
  job_url?: string | null;
  assignee_id?: number | null;
};

export function createApplication(workspaceId: number, payload: CreateApplicationPayload) {
  return authMutate<ApiApplication>(`/workspaces/${workspaceId}/applications`, "POST", payload);
}

export function updateApplicationApi(
  workspaceId: number,
  applicationId: number,
  payload: Partial<CreateApplicationPayload> & { clear_due_date?: boolean; clear_assignee_id?: boolean }
) {
  return authMutate<ApiApplication>(`/workspaces/${workspaceId}/applications/${applicationId}`, "PATCH", payload);
}

export function deleteApplicationApi(workspaceId: number, applicationId: number) {
  return authMutate<null>(`/workspaces/${workspaceId}/applications/${applicationId}`, "DELETE");
}

export function formatApplicationStatus(status: string): string {
  switch (status) {
    case "wishlist":
      return "Wishlist";
    case "applied":
      return "Applied";
    case "under_review":
      return "Under Review";
    case "interviewing":
      return "Interviewing";
    case "offered":
      return "Offered";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function formatDueDateTime(iso: string | null): string {
  if (!iso) return "No due date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.toLocaleDateString()}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export type CreateGoalPayload = {
  title: string;
  description?: string | null;
  status?: string;
  assignee_id?: number | null;
};

export function createGoal(workspaceId: number, payload: CreateGoalPayload) {
  return authMutate<PrimaryGoal>(`/workspaces/${workspaceId}/goals`, "POST", payload);
}

export type CreateTaskPayload = {
  title: string;
  priority: "high" | "medium" | "low";
  status?: "not_started" | "in_progress" | "completed";
  due_date?: string | null;
  clear_due_date?: boolean;
  estimated_minutes?: number | null;
  project_id?: number | null;
  goal_id?: number | null;
  clear_project_id?: boolean;
  clear_goal_id?: boolean;
  assignee_id?: number | null;
  clear_assignee_id?: boolean;
  description?: string | null;
};

export function createTask(workspaceId: number, payload: CreateTaskPayload) {
  return authMutate<ApiTask>(`/workspaces/${workspaceId}/tasks`, "POST", payload);
}

export function toggleTaskApi(workspaceId: number, taskId: number) {
  return authMutate<ApiTask>(`/workspaces/${workspaceId}/tasks/${taskId}/toggle`, "PATCH");
}

export function deleteTaskApi(workspaceId: number, taskId: number) {
  return authMutate<null>(`/workspaces/${workspaceId}/tasks/${taskId}`, "DELETE");
}

export type UpdateGoalPayload = {
  title?: string;
  description?: string | null;
  status?: string;
  assignee_id?: number | null;
  clear_assignee_id?: boolean;
};

export function updateGoalApi(workspaceId: number, goalId: number, payload: UpdateGoalPayload) {
  return authMutate<PrimaryGoal>(`/workspaces/${workspaceId}/goals/${goalId}`, "PATCH", payload);
}

export function deleteGoalApi(workspaceId: number, goalId: number) {
  return authMutate<null>(`/workspaces/${workspaceId}/goals/${goalId}`, "DELETE");
}

export type CreateProjectPayload = {
  project_name: string;
  project_description?: string | null;
  assignee_id?: number | null;
};

export function createProject(workspaceId: number, payload: CreateProjectPayload) {
  return authMutate<ApiProject>(`/workspaces/${workspaceId}/projects`, "POST", payload);
}

export function updateProjectApi(
  workspaceId: number,
  projectId: number,
  payload: Partial<CreateProjectPayload> & { status?: string; assignee_id?: number | null; clear_assignee_id?: boolean }
) {
  return authMutate<ApiProject>(`/workspaces/${workspaceId}/projects/${projectId}`, "PATCH", payload);
}

export function deleteProjectApi(workspaceId: number, projectId: number) {
  return authMutate<null>(`/workspaces/${workspaceId}/projects/${projectId}`, "DELETE");
}

export function updateTaskApi(
  workspaceId: number,
  taskId: number,
  payload: Partial<CreateTaskPayload>
) {
  return authMutate<ApiTask>(`/workspaces/${workspaceId}/tasks/${taskId}`, "PATCH", payload);
}

export function formatStageLabel(progress: number): string {
  if (progress >= 75) return "Stage 4 of 4";
  if (progress >= 50) return "Stage 3 of 4";
  if (progress >= 25) return "Stage 2 of 4";
  return "Stage 1 of 4";
}

export function formatStatus(status: string): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}
