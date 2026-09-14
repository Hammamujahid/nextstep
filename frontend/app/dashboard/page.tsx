"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Loader2,
  MailQuestion,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Sidebar, { type NavKey } from "../../components/dashboard/Sidebar";
import Topbar, { type TopbarUser } from "../../components/dashboard/Topbar";
import DashboardHome from "../../components/dashboard/DashboardHome";
import TasksView from "../../components/tasks/TasksView";
import ApplicationsView from "../../components/applications/ApplicationsView";
import ProjectsView from "../../components/projects/ProjectsView";
import GoalsView from "../../components/goals/GoalsView";
import WorkspaceGate from "../../components/workspace/WorkspaceGate";
import CreateWorkspaceModal from "../../components/workspace/CreateWorkspaceModal";
import InviteModal from "../../components/workspace/InviteModal";
import WorkspaceSettingsModal from "../../components/workspace/WorkspaceSettingsModal";
import { clearToken, getMeApi, getToken, logoutApi } from "../../lib/auth";
import {
  getActiveWorkspaceId,
  listMembersApi,
  listWorkspacesApi,
  setActiveWorkspaceId,
  type Workspace,
  type WorkspaceInvitation,
  type WorkspaceMember,
} from "../../lib/workspaces";

type Status = "checking" | "no-workspace" | "ready";

type ViewKey = NavKey | "settings";

const NAV_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your career at a glance" },
  goals: { title: "Goals", subtitle: "What you are working toward" },
  tasks: { title: "Tasks", subtitle: "Your next steps, prioritized" },
  projects: { title: "Projects", subtitle: "Portfolio and learning work" },
  applications: { title: "Job Applications", subtitle: "Track every opportunity" },
  members: { title: "Members", subtitle: "Who is in this workspace" },
  settings: { title: "Settings", subtitle: "Your account" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TopbarUser>({
    username: "",
    email: "",
    photo: null,
  });
  const [status, setStatus] = useState<Status>("checking");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeNav, setActiveNav] = useState<ViewKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const activeId = getActiveWorkspaceId();
  const active =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  useEffect(() => {
    async function init() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const me = await getMeApi(token);
        setProfile({
          username: me.username,
          email: me.email,
          photo: me.photo_profile,
        });

        const list = await listWorkspacesApi();
        if (list.length === 0) {
          setStatus("no-workspace");
          return;
        }

        const storedId = getActiveWorkspaceId();
        const stillExists = list.some((w) => w.id === storedId);
        setActiveWorkspaceId(stillExists ? (storedId as number) : list[0].id);
        setWorkspaces(list);
        setStatus("ready");
      } catch {
        clearToken();
        router.replace("/login");
      }
    }
    init();
  }, [router]);

  async function loadMembers(workspaceId: number) {
    setMembersLoading(true);
    try {
      const data = await listMembersApi(workspaceId);
      setMembers(data.members);
      setInvitations(data.invitations);
    } catch {
      setMembers([]);
      setInvitations([]);
    } finally {
      setMembersLoading(false);
    }
  }

  function resolveActiveId(): number | null {
    const stored = getActiveWorkspaceId();
    if (stored != null && workspaces.some((w) => w.id === stored)) return stored;
    return workspaces[0]?.id ?? null;
  }

  function handleNavChange(nav: NavKey) {
    setActiveNav(nav);
    setMobileOpen(false);
    if (nav === "members") {
      const id = resolveActiveId();
      if (id != null) loadMembers(id);
    }
  }

  async function handleLogout() {
    const token = getToken();
    setLoggingOut(true);
    try {
      if (token) await logoutApi(token);
    } catch {
      // tetap logout di sisi client walau server gagal
    } finally {
      clearToken();
      router.replace("/login");
    }
  }

  function handleWorkspaceCreated(workspace: Workspace) {
    setActiveWorkspaceId(workspace.id);
    setWorkspaces((prev) => {
      const next = [...prev, workspace];
      return next.sort((a, b) => a.id - b.id);
    });
    setCreateOpen(false);
    if (status === "no-workspace") setStatus("ready");
  }

  function handleWorkspaceUpdated(workspace: Workspace) {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspace.id ? workspace : w))
    );
  }

  function handleSelectWorkspace(id: number) {
    setActiveWorkspaceId(id);
    setMobileOpen(false);
    if (activeNav === "members") loadMembers(id);
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    );
  }

  if (status === "no-workspace") {
    return (
      <WorkspaceGate
        username={profile.username}
        onCreated={handleWorkspaceCreated}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    );
  }

  const meta = NAV_TITLES[activeNav];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        workspaces={workspaces}
        activeWorkspace={active}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={() => setCreateOpen(true)}
        onWorkspaceSettings={() => setWsSettingsOpen(true)}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onInvite={() => setInviteOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar
          title={activeNav === "dashboard" ? undefined : meta.title}
          subtitle={
            activeNav === "dashboard"
              ? undefined
              : `${meta.subtitle} · ${active?.name ?? ""}`
          }
          user={profile}
          loggingOut={loggingOut}
          onLogout={handleLogout}
          onSettings={() => {
            setActiveNav("settings");
            setMobileOpen(false);
          }}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {activeNav === "dashboard" && (
            <DashboardHome username={profile.username} />
          )}

          {activeNav === "tasks" && <TasksView />}

          {activeNav === "applications" && <ApplicationsView />}

          {activeNav === "projects" && <ProjectsView />}

          {activeNav === "goals" && <GoalsView />}

          {activeNav === "settings" && (
            <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Account</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your NextStep profile details.
              </p>
              <div className="mt-5 flex items-center gap-4">
                {profile.photo ? (
                  <Image
                    src={profile.photo}
                    alt={profile.username || "Profile photo"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-sky-100"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-white">
                    {(profile.username.trim().charAt(0) || "?").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">
                    {profile.username || "-"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {profile.email || "-"}
                  </p>
                </div>
              </div>
              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Username</dt>
                  <dd className="font-medium text-slate-900">
                    {profile.username || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="truncate font-medium text-slate-900">
                    {profile.email || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Workspaces joined</dt>
                  <dd className="font-medium text-slate-900">
                    {workspaces.length}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeNav === "members" && (
            <div className="anim-fade-up space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">
                    Members ({members.length})
                  </h2>
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="rounded-xl bg-sky-400 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
                  >
                    Invite user
                  </button>
                </div>
                {membersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No members found.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {members.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                          {(m.username.trim().charAt(0) || "?").toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {m.username}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {m.email}
                          </span>
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            m.member_role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {m.member_role === "admin" && (
                            <Crown className="h-3 w-3" />
                          )}
                          {m.member_role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <MailQuestion className="h-4 w-4 text-slate-400" />
                  Pending invitations ({invitations.length})
                </h2>
                {invitations.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <UserRound className="h-4 w-4" />
                    No pending invitations.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {invitations.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5"
                      >
                        <span className="truncate text-sm font-medium text-slate-700">
                          {inv.email}
                        </span>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleWorkspaceCreated}
      />
      <InviteModal
        open={inviteOpen}
        workspaceId={active?.id ?? null}
        workspaceName={active?.name ?? ""}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {
          const id = resolveActiveId();
          if (id != null) loadMembers(id);
        }}
      />
      <WorkspaceSettingsModal
        key={active ? `${active.id}-${wsSettingsOpen}` : "closed"}
        open={wsSettingsOpen}
        workspace={active}
        onClose={() => setWsSettingsOpen(false)}
        onUpdated={handleWorkspaceUpdated}
      />
    </div>
  );
}
