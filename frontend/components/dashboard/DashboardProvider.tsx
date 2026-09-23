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
import { clearTokens, getMeApi, getToken, logoutApi } from "../../lib/auth";
import {
  acceptInvitationApi,
  declineInvitationApi,
  fetchMyPermissionsApi,
  getActiveWorkspaceId,
  listMembersApi,
  listMyInvitationsApi,
  listWorkspacesApi,
  selectWorkspaceApi,
  setActiveWorkspaceId,
  type MyInvitation,
  type Workspace,
  type WorkspaceInvitation,
  type WorkspaceMember,
} from "../../lib/workspaces";
import type { PermissionMap } from "../../lib/permissions";

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
  myRole: string | null;
  perms: PermissionMap;
  permsLoading: boolean;
  myInvitations: MyInvitation[];
  myInvitesOpen: boolean;
  inviteOpen: boolean;
  createWorkspaceOpen: boolean;
  workspaceSettingsOpen: boolean;
  openInvite: () => void;
  closeInvite: () => void;
  openCreateWorkspace: () => void;
  closeCreateWorkspace: () => void;
  openWorkspaceSettings: () => void;
  closeWorkspaceSettings: () => void;
  openMyInvites: () => void;
  closeMyInvites: () => void;
  acceptMyInvitation: (id: number) => Promise<void>;
  declineMyInvitation: (id: number) => Promise<void>;
  loadMembers: (workspaceId: number) => Promise<void>;
  refreshActiveMembers: () => void;
  refreshProfile: () => Promise<void>;
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
  const [myRole, setMyRole] = useState<string | null>(null);
  const [perms, setPerms] = useState<PermissionMap>({});
  const [permsLoading, setPermsLoading] = useState(true);
  const [myInvitations, setMyInvitations] = useState<MyInvitation[]>([]);
  const [myInvitesOpen, setMyInvitesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);
  const openCreateWorkspace = useCallback(() => setCreateWorkspaceOpen(true), []);
  const closeCreateWorkspace = useCallback(() => setCreateWorkspaceOpen(false), []);
  const openWorkspaceSettings = useCallback(() => setWorkspaceSettingsOpen(true), []);
  const closeWorkspaceSettings = useCallback(() => setWorkspaceSettingsOpen(false), []);

  const loadMyInvitations = useCallback(async (autoOpen: boolean) => {
    try {
      const list = await listMyInvitationsApi();
      setMyInvitations(list);
      if (autoOpen && list.length > 0) setMyInvitesOpen(true);
    } catch {
      setMyInvitations([]);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const me = await getMeApi();
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

        // sumber utama: active_workspace_id dari server, fallback localStorage, lalu pertama
        const ids = list.map((w) => w.id);
        const serverId = me.active_workspace_id;
        const storedId = getActiveWorkspaceId();
        const resolved =
          serverId != null && ids.includes(serverId)
            ? serverId
            : storedId != null && ids.includes(storedId)
              ? storedId
              : list[0].id;
        setActiveWorkspaceId(resolved);
        setActiveId(resolved);
        setWorkspaces(list);
        setStatus("ready");
        void loadMyInvitations(true);
      } catch {
        clearTokens();
        router.replace("/login");
      }
    }
    init();
  }, [router, loadMyInvitations]);

  // memoize agar identitas stabil antar-render; tanpanya efek ber-dep `active`
  // (mis. loadMembers) refetch tiap render dan switch workspace terasa macet
  const active = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null,
    [workspaces, activeId]
  );

  const activePermsId = active?.id ?? null;
  const activePermsRole = active?.member_role ?? null;

  // permission saya di workspace aktif (untuk gating nav + halaman + read-only)
  useEffect(() => {
    if (!activePermsId) {
      setMyRole(null);
      setPerms({});
      setPermsLoading(false);
      return;
    }
    let cancelled = false;
    setPermsLoading(true);
    fetchMyPermissionsApi(activePermsId)
      .then((d) => {
        if (cancelled) return;
        setMyRole(d.member_role);
        setPerms((d.permissions ?? {}) as PermissionMap);
      })
      .catch(() => {
        if (cancelled) return;
        setMyRole(activePermsRole);
        setPerms({});
      })
      .finally(() => {
        if (!cancelled) setPermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePermsId, activePermsRole]);

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

  const openMyInvites = useCallback(() => setMyInvitesOpen(true), []);
  const closeMyInvites = useCallback(() => setMyInvitesOpen(false), []);

  const acceptMyInvitation = useCallback(async (id: number) => {
    const workspaceId = await acceptInvitationApi(id);
    const [list, wsList] = await Promise.all([
      listMyInvitationsApi().catch(() => [] as MyInvitation[]),
      listWorkspacesApi().catch(() => [] as Workspace[]),
    ]);
    setMyInvitations(list);
    if (list.length === 0) setMyInvitesOpen(false);
    if (wsList.length > 0) {
      setWorkspaces(wsList);
      if (wsList.some((w) => w.id === workspaceId)) {
        setActiveWorkspaceId(workspaceId);
        setActiveId(workspaceId);
      }
    }
  }, []);

  const declineMyInvitation = useCallback(async (id: number) => {
    await declineInvitationApi(id);
    const list = await listMyInvitationsApi().catch(() => [] as MyInvitation[]);
    setMyInvitations(list);
    if (list.length === 0) setMyInvitesOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
    } catch {
      // tetap logout di sisi client walau server gagal
    } finally {
      clearTokens();
      router.replace("/login");
    }
  }, [router]);

  const selectWorkspace = useCallback((id: number) => {
    setActiveWorkspaceId(id);
    setActiveId(id);
    // simpan pilihan ke server agar konsisten antar perangkat/refresh;
    // state lokal langsung berubah sehingga dropdown terasa responsif
    selectWorkspaceApi(id).catch(() => {});
  }, []);

  const handleWorkspaceCreated = useCallback((workspace: Workspace) => {
    // pembuat selalu admin; API create tidak mengembalikan member_role
    const withRole: Workspace = { ...workspace, member_role: workspace.member_role || "admin" };
    setActiveWorkspaceId(withRole.id);
    setActiveId(withRole.id);
    setWorkspaces((prev) => {
      const next = [...prev.filter((w) => w.id !== withRole.id), withRole];
      return next.sort((a, b) => a.id - b.id);
    });
    setStatus("ready");
    closeCreateWorkspace();
  }, [closeCreateWorkspace]);

  const handleWorkspaceUpdated = useCallback((workspace: Workspace) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === workspace.id ? workspace : w))
    );
  }, []);

  const refreshActiveMembers = useCallback(() => {
    if (active) loadMembers(active.id);
  }, [active, loadMembers]);

  const refreshProfile = useCallback(async () => {
    const me = await getMeApi();
    setProfile({
      username: me.username,
      email: me.email,
      photo: me.photo_profile,
    });
  }, []);

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
      myRole,
      perms,
      permsLoading,
      myInvitations,
      myInvitesOpen,
      inviteOpen,
      createWorkspaceOpen,
      workspaceSettingsOpen,
      openInvite,
      closeInvite,
      openCreateWorkspace,
      closeCreateWorkspace,
      openWorkspaceSettings,
      closeWorkspaceSettings,
      openMyInvites,
      closeMyInvites,
      acceptMyInvitation,
      declineMyInvitation,
      loadMembers,
      refreshActiveMembers,
      refreshProfile,
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
      myRole,
      perms,
      permsLoading,
      myInvitations,
      myInvitesOpen,
      inviteOpen,
      createWorkspaceOpen,
      workspaceSettingsOpen,
      openInvite,
      closeInvite,
      openCreateWorkspace,
      closeCreateWorkspace,
      openWorkspaceSettings,
      closeWorkspaceSettings,
      openMyInvites,
      closeMyInvites,
      acceptMyInvitation,
      declineMyInvitation,
      loadMembers,
      refreshActiveMembers,
      refreshProfile,
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