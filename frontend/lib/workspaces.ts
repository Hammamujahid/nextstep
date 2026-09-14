import { API_BASE, getToken } from "./auth";

export type Workspace = {
  id: number;
  name: string;
  description: string | null;
  member_role: string;
  created_at: string;
  updated_at: string;
};

const WORKSPACE_KEY = "nextstep_workspace_id";

export function getActiveWorkspaceId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WORKSPACE_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) ? id : null;
}

export function setActiveWorkspaceId(id: number) {
  localStorage.setItem(WORKSPACE_KEY, String(id));
}

async function authFetch(path: string, init?: RequestInit) {
  const token = getToken();
  if (!token) throw { message: "You are not logged in." };
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (res.status === 401) throw { message: "Session expired, please log in again.", unauthorized: true };
  if (!res.ok) {
    try {
      const data = await res.json();
      if (typeof data?.message === "string") {
        throw {
          message: data.message,
          details: Array.isArray(data.details) ? data.details : undefined,
        };
      }
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) throw err;
    }
    throw { message: `Request failed with status ${res.status}` };
  }
  return res.json();
}

export async function listWorkspacesApi(): Promise<Workspace[]> {
  const data = await authFetch("/workspaces");
  return Array.isArray(data?.data) ? data.data : [];
}

export type WorkspaceMember = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  member_role: string;
  created_at: string;
};

export type WorkspaceInvitation = {
  id: number;
  workspace_id: number;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createWorkspaceApi(input: {
  name: string;
  description?: string;
}): Promise<Workspace> {
  const data = await authFetch("/workspaces", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      ...(input.description?.trim()
        ? { description: input.description.trim() }
        : {}),
    }),
  });
  return data.data as Workspace;
}

export async function updateWorkspaceApi(
  workspaceId: number,
  input: { name: string; description?: string }
): Promise<Workspace> {
  const data = await authFetch(`/workspaces/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      ...(input.description?.trim()
        ? { description: input.description.trim() }
        : {}),
    }),
  });
  return data.data as Workspace;
}

export async function listMembersApi(workspaceId: number): Promise<{
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
}> {
  const data = await authFetch(`/workspaces/${workspaceId}/members`);
  return {
    members: Array.isArray(data?.data?.members) ? data.data.members : [],
    invitations: Array.isArray(data?.data?.invitations)
      ? data.data.invitations
      : [],
  };
}

export async function inviteMemberApi(
  workspaceId: number,
  email: string
): Promise<WorkspaceInvitation> {
  const data = await authFetch(`/workspaces/${workspaceId}/invite`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data.data as WorkspaceInvitation;
}
