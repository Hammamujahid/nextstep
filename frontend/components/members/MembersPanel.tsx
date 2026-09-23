"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useDashboard } from "../dashboard/DashboardProvider";
import {
  cancelInvitationApi,
  removeMemberApi,
  updateMemberPermissionApi,
  type PermissionValue,
  type WorkspaceInvitation,
  type WorkspaceMember,
} from "../../lib/workspaces";
import InlineSelect from "../ui/InlineSelect";

type RoleFilter = "all" | "admin" | "member";
type StatusFilter = "all" | "active" | "pending";

type Row =
  | { kind: "member"; id: string; search: string; role: string; member: WorkspaceMember }
  | { kind: "invite"; id: string; search: string; role: string; invite: WorkspaceInvitation };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const init = parts.map((w) => w[0] ?? "").join("").toUpperCase();
  return init || "?";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PERM_STYLE: Record<PermissionValue, string> = {
  editor: "bg-blue-50 text-blue-500",
  viewer: "bg-slate-100 text-slate-500",
  none: "bg-slate-100 text-slate-400 line-through",
};

function PermBadge({ value }: { value: PermissionValue }) {
  const label = value === "none" ? "None" : value === "editor" ? "Editor" : "Viewer";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${PERM_STYLE[value]}`}>
      {label}
    </span>
  );
}

export default function MembersPanel() {
  const {
    members,
    invitations,
    membersLoading,
    loadMembers,
    active,
    openInvite,
    profile,
    myRole,
  } = useDashboard();
  // null = permission belum termuat, biarkan terlihat dulu agar tidak flicker
  const isAdmin = myRole === null || myRole === "admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (active) loadMembers(active.id);
  }, [active, loadMembers]);

  async function handleRemoveMember(id: number) {
    if (!active) return;
    setRemovingId(id);
    try {
      await removeMemberApi(active.id, id);
      setConfirmingRemoveId(null);
      await loadMembers(active.id);
    } catch (e) {
      console.error("remove member failed", e);
    } finally {
      setRemovingId(null);
    }
  }

  async function handlePermissionChange(
    memberId: number,
    resource: "project" | "task" | "goal" | "job_application",
    permission: PermissionValue
  ) {
    if (!active) return;
    try {
      await updateMemberPermissionApi(active.id, memberId, resource, permission);
      await loadMembers(active.id);
    } catch (e) {
      console.error("update permission failed", e);
    }
  }

  // kolom permission jadi dropdown khusus admin; baris sendiri & sesama admin tetap badge statis
  function permCell(
    m: WorkspaceMember,
    resource: "project" | "task" | "goal" | "job_application",
    value: PermissionValue
  ) {
    if (!isAdmin || m.member_role === "admin" || m.email === profile.email) {
      return <PermBadge value={value} />;
    }
    return (
      <InlineSelect
        value={value}
        options={[
          { value: "editor", label: "Editor", dot: "bg-blue-500" },
          { value: "viewer", label: "Viewer", dot: "bg-slate-400" },
          { value: "none", label: "None", dot: "bg-slate-300" },
        ]}
        onChange={(v) => void handlePermissionChange(m.id, resource, v as PermissionValue)}
        label={`Change ${resource} permission of ${m.username}`}
        buttonClassName={`rounded-full px-2.5 py-1 text-[10px] font-medium outline-none transition ${PERM_STYLE[value]}`}
        menuWidth={140}
      />
    );
  }

  async function handleCancelInvitation(id: number) {
    if (!active) return;
    setCancellingId(id);
    try {
      await cancelInvitationApi(active.id, id);
      await loadMembers(active.id);
    } catch (e) {
      console.error("cancel invitation failed", e);
    } finally {
      setCancellingId(null);
    }
  }

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [
      ...members.map(
        (m): Row => ({
          kind: "member",
          id: `m-${m.id}`,
          search: `${m.username} ${m.email}`.toLowerCase(),
          role: m.member_role,
          member: m,
        })
      ),
      ...invitations.map(
        (inv): Row => ({
          kind: "invite",
          id: `i-${inv.id}`,
          search: inv.email.toLowerCase(),
          role: "member",
          invite: inv,
        })
      ),
    ];
    const q = search.trim().toLowerCase();
    return list.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter === "active" && r.kind !== "member") return false;
      if (statusFilter === "pending" && r.kind !== "invite") return false;
      if (!q) return true;
      return r.search.includes(q);
    });
  }, [members, invitations, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = members.length + invitations.length;
    const activeCount = members.length;
    const pending = invitations.length;
    const admins = members.filter((m) => m.member_role === "admin").length;
    return { total, active: activeCount, pending, admins };
  }, [members, invitations]);

  if (!active) {
    return (
      <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">No workspace selected.</p>
      </div>
    );
  }

  const statCards = [
    { title: "Total Members", value: stats.total, description: "People in workspace", icon: Users, iconStyle: "bg-blue-50 text-blue-500" },
    { title: "Active", value: stats.active, description: "Currently active", icon: CheckCircle2, iconStyle: "bg-emerald-50 text-emerald-500" },
    { title: "Pending", value: stats.pending, description: "Waiting for invitation", icon: Clock3, iconStyle: "bg-orange-50 text-orange-500" },
    { title: "Admins", value: stats.admins, description: "Workspace administrators", icon: ShieldCheck, iconStyle: "bg-purple-50 text-purple-500" },
  ];

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <Users size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Members
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage members and their workspace permissions.
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openInvite}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <UserPlus size={18} />
            Invite Member
          </button>
        )}
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconStyle}`}>
              <s.icon size={21} />
            </div>
            <p className="mt-4 text-sm text-slate-500">{s.title}</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-900">{s.value}</h3>
            <p className="mt-1 text-xs text-slate-400">{s.description}</p>
          </div>
        ))}
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
              placeholder="Search members..."
              aria-label="Search members"
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                aria-label="Filter by role"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            {(search || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MEMBERS TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Workspace Members</h2>
          <p className="mt-1 text-xs text-slate-400">{rows.length} members found</p>
        </div>
        <div className="overflow-x-auto">
          {membersLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50">
                  <div className="h-full w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search size={20} />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">No members found</p>
              <p className="mt-1 text-xs text-slate-400">Try another search or filter.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-400">
                  <th className="px-5 py-4 font-medium">Member</th>
                  <th className="px-4 py-4 font-medium">Role</th>
                  <th className="px-4 py-4 font-medium">Tasks</th>
                  <th className="px-4 py-4 font-medium">Goals</th>
                  <th className="px-4 py-4 font-medium">Projects</th>
                  <th className="px-4 py-4 font-medium">Job Applications</th>
                  <th className="px-4 py-4 font-medium">Joined</th>
                  <th className="w-24 px-4 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  if (r.kind === "member") {
                    const m = r.member;
                    const perms = m.permissions;
                    return (
                      <tr key={r.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-500">
                              {initialsOf(m.username)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{m.username}</p>
                              <p className="mt-0.5 truncate text-xs text-slate-400">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${m.member_role === "admin" ? "bg-purple-50 text-purple-500" : "bg-slate-100 text-slate-500"}`}>
                            {m.member_role === "admin" ? "Admin" : "Member"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">{permCell(m, "task", perms?.task ?? "viewer")}</td>
                        <td className="whitespace-nowrap px-4 py-4">{permCell(m, "goal", perms?.goal ?? "viewer")}</td>
                        <td className="whitespace-nowrap px-4 py-4">{permCell(m, "project", perms?.project ?? "viewer")}</td>
                        <td className="whitespace-nowrap px-4 py-4">{permCell(m, "job_application", perms?.job_application ?? "viewer")}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                          {fmtDate(m.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          {isAdmin && m.email !== profile.email && (
                            confirmingRemoveId === m.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => void handleRemoveMember(m.id)}
                                  disabled={removingId === m.id}
                                  aria-label={`Confirm remove ${m.username}`}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {removingId === m.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Sure?"
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmingRemoveId(null)}
                                  aria-label="Cancel remove"
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmingRemoveId(m.id)}
                                aria-label={`Remove ${m.username}`}
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  }
                  const inv = r.invite;
                  return (
                    <tr key={r.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-500">
                            {initialsOf(inv.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-800">
                              <span className="truncate">{inv.email}</span>
                              <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-medium text-orange-500">
                                Pending
                              </span>
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">Invited {fmtDate(inv.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                          Member
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4"><PermBadge value={inv.task_permission} /></td>
                      <td className="whitespace-nowrap px-4 py-4"><PermBadge value={inv.goal_permission} /></td>
                      <td className="whitespace-nowrap px-4 py-4"><PermBadge value={inv.project_permission} /></td>
                      <td className="whitespace-nowrap px-4 py-4"><PermBadge value={inv.job_application_permission} /></td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                        {fmtDate(inv.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        {isAdmin && (
                          <button
                            onClick={() => void handleCancelInvitation(inv.id)}
                            disabled={cancellingId === inv.id}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cancellingId === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Cancel"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* PERMISSION LEVELS (full width) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Permission Levels</h3>
            <p className="text-xs text-slate-400">Control what each member can do.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <PermBadge value="viewer" />
            <p className="text-xs text-slate-500">Can view content but cannot make changes.</p>
          </div>
          <div className="flex items-center gap-3">
            <PermBadge value="editor" />
            <p className="text-xs text-slate-500">Can view and modify content.</p>
          </div>
          <div className="flex items-center gap-3">
            <PermBadge value="none" />
            <p className="text-xs text-slate-500">No access to that area at all.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
