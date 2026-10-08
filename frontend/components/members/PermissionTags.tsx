"use client";

import type { PermissionValue, WorkspaceInvitation } from "../../lib/workspaces";

const TAG_STYLE: Record<PermissionValue, string> = {
  none: "bg-slate-100 text-slate-500",
  viewer: "bg-indigo-100 text-indigo-700",
  editor: "bg-emerald-100 text-emerald-700",
};

const TAG_LABEL: Record<PermissionValue, string> = {
  none: "None",
  viewer: "Viewer",
  editor: "Editor",
};

function PermTag({ resource, value }: { resource: string; value: PermissionValue }) {
  return (
    <span
      title={`${resource}: ${TAG_LABEL[value]}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TAG_STYLE[value]}`}
    >
      {resource} · {TAG_LABEL[value]}
    </span>
  );
}

// Deretan tag role per resource sesuai workspace_member_permissions
// (project / task / goal / job_application × none / viewer / editor).
export default function PermissionTags({
  invitation,
  className = "",
}: {
  invitation: Pick<
    WorkspaceInvitation,
    "project_permission" | "task_permission" | "goal_permission" | "job_application_permission"
  >;
  className?: string;
}) {
  return (
    <span className={`flex flex-wrap items-center gap-1 ${className}`}>
      <PermTag resource="Project" value={invitation.project_permission} />
      <PermTag resource="Task" value={invitation.task_permission} />
      <PermTag resource="Goal" value={invitation.goal_permission} />
      <PermTag resource="Application" value={invitation.job_application_permission} />
    </span>
  );
}
