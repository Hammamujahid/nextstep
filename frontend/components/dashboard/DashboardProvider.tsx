"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { TopbarUser } from "./Topbar";
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

type DashboardContextValue = {
  status: Status;
  profile: TopbarUser;
  workspaces: Workspace[];
  active: Workspace | null;
  loggingOut: boolean;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  membersLoading: boolean;
  inviteOpen: boolean;
  createWorkspaceOpen: boolean;
  workspaceSettingsOpen: boolean;
  openInvite: () => void;
  closeInvite: () => void;
  openCreateWorkspace: () => void;
  closeCreateWorkspace: () => void;
  openWorkspaceSettings: () => void;
  closeWorkspaceSettings: () => void;
  loadMembers: (workspaceId: number) => Promise<void>;
  refreshActiveMembers: () => void;
  selectWorkspace: (id: number) => void;
  handleLogout: () => Promise<void>;
  handleWorkspaceCreated: (workspace: Workspace) => void;
  handleWorkspaceUpdated: (workspace: Workspace) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}

export default function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<TopbarUser>({
    username: "",
    email: "",
    photo: null,
  });
  const [status, setStatus] = useState<Status>("checking");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<number | null>(() =>
    getActiveWorkspaceId()
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);
  const openCreateWorkspace = useCallback(() => setCreateWorkspaceOpen(true), []);
  const closeCreateWorkspace = useCallback(() => setCreateWorkspaceOpen(false), []);
  const openWorkspaceSettings = useCallback(() => setWorkspaceSettingsOpen(true), []);
  const closeWorkspaceSettings = useCallback(() => setWorkspaceSettingsOpen(false), []);

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
        const resolved = stillExists ? (storedId as number) : list[0].id;
        setActiveWorkspaceId(resolved);
        setActiveId(resolved);
        setWorkspaces(list);
        setStatus("ready");
      } catch {
        clearToken();
        router.replace("/login");
      }
    }
    init();
  }, [router]);

  const active =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  const loadMembers = useCallback(async (workspaceId: number) => {
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
  }, []);

  const handleLogout = useCallback(async () => {
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
  }, [router]);

  const selectWorkspace = useCallback((id: number) => {
    setActiveWorkspaceId(id);
    setActiveId(id);
  }, []);

  const handleWorkspaceCreated = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    setActiveId(workspace.id);
    setWorkspaces((prev) => {
      const next = [...prev, workspace];
      return next.sort((a, b) => a.id - b.id);
    });
    setStatus("ready");
  }, []);

  const handleWorkspaceUpdated = useCallback((workspace: Workspace) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspace.id ? workspace : w))
    );
  }, []);

  const refreshActiveMembers = useCallback(() => {
    if (active) loadMembers(active.id);
  }, [active, loadMembers]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      status,
      profile,
      workspaces,
      active,
      loggingOut,
      members,
      invitations,
      membersLoading,
      inviteOpen,
      createWorkspaceOpen,
      workspaceSettingsOpen,
      openInvite,
      closeInvite,
      openCreateWorkspace,
      closeCreateWorkspace,
      openWorkspaceSettings,
      closeWorkspaceSettings,
      loadMembers,
      refreshActiveMembers,
      selectWorkspace,
      handleLogout,
      handleWorkspaceCreated,
      handleWorkspaceUpdated,
    }),
    [
      status,
      profile,
      workspaces,
      active,
      loggingOut,
      members,
      invitations,
      membersLoading,
      inviteOpen,
      createWorkspaceOpen,
      workspaceSettingsOpen,
      openInvite,
      closeInvite,
      openCreateWorkspace,
      closeCreateWorkspace,
      openWorkspaceSettings,
      closeWorkspaceSettings,
      loadMembers,
      refreshActiveMembers,
      selectWorkspace,
      handleLogout,
      handleWorkspaceCreated,
      handleWorkspaceUpdated,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}