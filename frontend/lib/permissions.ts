import type { PermissionValue } from "./workspaces";

export type ResourceKey = "project" | "task" | "goal" | "job_application";

export type PermissionMap = Partial<Record<ResourceKey, PermissionValue>>;

export function permOf(perms: PermissionMap | null | undefined, resource: ResourceKey): PermissionValue {
  return perms?.[resource] ?? "viewer";
}

// boleh lihat kalau admin atau permission bukan none
export function canRead(
  role: string | null | undefined,
  perms: PermissionMap | null | undefined,
  resource: ResourceKey
): boolean {
  if (role === "admin") return true;
  return permOf(perms, resource) !== "none";
}

// boleh ubah kalau admin atau permission editor
export function canEdit(
  role: string | null | undefined,
  perms: PermissionMap | null | undefined,
  resource: ResourceKey
): boolean {
  if (role === "admin") return true;
  return permOf(perms, resource) === "editor";
}
