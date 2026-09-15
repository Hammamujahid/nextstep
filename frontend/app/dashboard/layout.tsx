"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import DashboardProvider, {
  useDashboard,
} from "../../components/dashboard/DashboardProvider";
import WorkspaceGate from "../../components/workspace/WorkspaceGate";
import CreateWorkspaceModal from "../../components/workspace/CreateWorkspaceModal";
import InviteModal from "../../components/workspace/InviteModal";
import WorkspaceSettingsModal from "../../components/workspace/WorkspaceSettingsModal";
import { NAV_TITLES, viewFromPath } from "../../lib/dashboardRoutes";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    status,
    profile,
    workspaces,
    active,
    loggingOut,
    selectWorkspace,
    handleLogout,
    handleWorkspaceCreated,
    handleWorkspaceUpdated,
    refreshActiveMembers,
    inviteOpen,
    closeInvite,
    openInvite,
    createWorkspaceOpen,
    closeCreateWorkspace,
    openCreateWorkspace,
    workspaceSettingsOpen,
    closeWorkspaceSettings,
    openWorkspaceSettings,
  } = useDashboard();

  const [mobileOpen, setMobileOpen] = useState(false);

  const view = viewFromPath(pathname);
  const meta = NAV_TITLES[view];

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        workspaces={workspaces}
        activeWorkspace={active}
        onSelectWorkspace={selectWorkspace}
        onCreateWorkspace={openCreateWorkspace}
        onWorkspaceSettings={openWorkspaceSettings}
        onInvite={openInvite}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar
          title={view === "dashboard" ? undefined : meta.title}
          subtitle={
            view === "dashboard"
              ? undefined
              : `${meta.subtitle} · ${active?.name ?? ""}`
          }
          user={profile}
          loggingOut={loggingOut}
          onLogout={handleLogout}
          onSettings={() => {
            router.push("/dashboard/settings");
            setMobileOpen(false);
          }}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>

      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={closeCreateWorkspace}
        onCreated={handleWorkspaceCreated}
      />
      <InviteModal
        open={inviteOpen}
        workspaceId={active?.id ?? null}
        workspaceName={active?.name ?? ""}
        onClose={closeInvite}
        onInvited={refreshActiveMembers}
      />
      <WorkspaceSettingsModal
        key={active ? `${active.id}-${workspaceSettingsOpen}` : "closed"}
        open={workspaceSettingsOpen}
        workspace={active}
        onClose={closeWorkspaceSettings}
        onUpdated={handleWorkspaceUpdated}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}