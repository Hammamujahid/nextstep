import { API_BASE, getToken } from "./auth";

export type PrimaryGoal = {
  id: number;
  workspace_id: number;
  title: string;
  description: string | null;
  status: string;
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
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/primary-goal`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load primary goal");
  }

  const json = await res.json();
  return json.data as PrimaryGoal | null;
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
    interviewing: number;
    offered: number;
    rejected: number;
  };
};

export async function fetchMetrics(workspaceId: number): Promise<DashboardMetrics> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/metrics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load metrics");
  }

  const json = await res.json();
  return json.data as DashboardMetrics;
}

async function authGet<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to load ${path}`);
  }
  const json = await res.json();
  return json.data as T;
}

async function authMutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.message || (Array.isArray(data.details) ? data.details.join(", ") : "") || `Failed to ${method} ${path}`;
    throw new Error(msg);
  }
  const json = await res.json().catch(() => ({ data: null }));
  return json.data as T;
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
  created_at: string;
  updated_at: string;
};

export type ApiProject = {
  id: number;
  workspace_id: number;
  project_name: string;
  project_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ApiApplication = {
  id: number;
  workspace_id: number;
  job_title: string;
  company_name: string;
  status: string;
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

export type CreateGoalPayload = {
  title: string;
  description?: string | null;
  status?: string;
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
  description?: string | null;
};

export function createTask(workspaceId: number, payload: CreateTaskPayload) {
  return authMutate<ApiTask>(`/workspaces/${workspaceId}/tasks`, "POST", payload);
}

export function toggleTaskApi(workspaceId: number, taskId: number) {
  return authMutate<ApiTask>(`/workspaces/${workspaceId}/tasks/${taskId}/toggle`, "PATCH");
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
