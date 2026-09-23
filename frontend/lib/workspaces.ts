import { apiFetch } from "./apiClient";

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

async function authFetch(path: string, init?: RequestInit): Promise<any> {
  const data: any = await apiFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return data;
}

export async function listWorkspacesApi(): Promise<Workspace[]> {
  const data = await authFetch("/workspaces");
  return Array.isArray(data?.data) ? data.data : [];
}

export type MemberPermissions = {
  project: PermissionValue;
  task: PermissionValue;
  goal: PermissionValue;
  job_application: PermissionValue;
};

export type WorkspaceMember = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  member_role: string;
  created_at: string;
  permissions: MemberPermissions | null;
};

export type PermissionValue = "none" | "viewer" | "editor";

export type InvitePermissions = {
  project: PermissionValue;
  task: PermissionValue;
  goal: PermissionValue;
  job_application: PermissionValue;
};

export type WorkspaceInvitation = {
  id: number;
  workspace_id: number;
  email: string;
  status: string;
  project_permission: PermissionValue;
  task_permission: PermissionValue;
  goal_permission: PermissionValue;
  job_application_permission: PermissionValue;
  created_at: string;
  updated_at: string;
};

export type MyInvitation = WorkspaceInvitation & {
  workspace_name: string;
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

export async function selectWorkspaceApi(workspaceId: number): Promise<number> {
  const data = await authFetch(`/workspaces/${workspaceId}/select`, {
    method: "POST",
  });
  return data?.data?.workspace_id as number;
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
  email: string,
  permissions?: InvitePermissions
): Promise<WorkspaceInvitation> {
  const data = await authFetch(`/workspaces/${workspaceId}/invite`, {
    method: "POST",
    body: JSON.stringify({ email, ...(permissions ? { permissions } : {}) }),
  });
  return data.data as WorkspaceInvitation;
}

export type MyPermissions = {
  member_role: string;
  permissions: Record<string, PermissionValue>;
};

export async function fetchMyPermissionsApi(
  workspaceId: number
): Promise<MyPermissions> {
  const data = await authFetch(`/workspaces/${workspaceId}/my-permissions`);
  return data.data as MyPermissions;
}

export async function listMyInvitationsApi(): Promise<MyInvitation[]> {
  const data = await authFetch("/invitations");
  return Array.isArray(data?.data) ? (data.data as MyInvitation[]) : [];
}

export async function acceptInvitationApi(invitationId: number): Promise<number> {
  const data = await authFetch(`/invitations/${invitationId}/accept`, {
    method: "POST",
  });
  return data?.data?.workspace_id as number;
}

export async function declineInvitationApi(invitationId: number): Promise<void> {
  await authFetch(`/invitations/${invitationId}/decline`, {
    method: "POST",
  });
}

export async function cancelInvitationApi(
  workspaceId: number,
  invitationId: number
): Promise<void> {
  await authFetch(`/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: "DELETE",
  });
}

export async function removeMemberApi(
  workspaceId: number,
  memberId: number
): Promise<void> {
  await authFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function updateMemberPermissionApi(
  workspaceId: number,
  memberId: number,
  resource: string,
  permission: PermissionValue
): Promise<void> {
  await authFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify({ resource, permission }),
  });
}
