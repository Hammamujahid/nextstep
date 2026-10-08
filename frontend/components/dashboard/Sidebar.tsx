"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  Sparkles,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Logo from "../Logo";
import type { Workspace } from "../../lib/workspaces";
import {
  NAV_HREF,
  viewFromPath,
  type NavKey,
} from "../../lib/dashboardRoutes";

export type { NavKey };

export const NAV_ITEMS: { key: NavKey; label: string; icon: typeof Target; tint: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, tint: "text-indigo-500" },
  { key: "goals", label: "Goals", icon: Target, tint: "text-violet-500" },
  { key: "tasks", label: "Tasks", icon: ListChecks, tint: "text-emerald-500" },
  { key: "projects", label: "Projects", icon: FolderKanban, tint: "text-indigo-500" },
  { key: "applications", label: "Job Applications", icon: Briefcase, tint: "text-amber-500" },
  { key: "members", label: "Members", icon: Users, tint: "text-pink-500" },
];

type SidebarProps = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (id: number) => void;
  onCreateWorkspace: () => void;
  onWorkspaceSettings: () => void;
  onInvite: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  hiddenNavs?: NavKey[];
  canInvite?: boolean;
  canManageWorkspace?: boolean;
};

type SidebarBodyProps = Omit<SidebarProps, "mobileOpen">;

function workspaceInitial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

// Isi sidebar dipisah jadi komponen sendiri supaya tiap <aside> yang ter-mount
// (desktop + drawer mobile) punya dropdown state/ref sendiri.
function SidebarBody({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onWorkspaceSettings,
  onInvite,
  onCloseMobile,
  hiddenNavs = [],
  canInvite = true,
  canManageWorkspace = true,
}: SidebarBodyProps) {
  const pathname = usePathname();
  const activeNav = viewFromPath(pathname);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropOpen]);

  const visibleNavs = NAV_ITEMS.filter((item) => !hiddenNavs.includes(item.key));

  return (
    <div className="flex h-full flex-col gap-4 p-3.5">
      <div className="flex h-11 items-center justify-between px-1.5">
        <Logo />
        <button
          onClick={onCloseMobile}
          className="clay-btn rounded-xl p-1.5 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace switcher (ClickUp-style) */}
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setDropOpen((v) => !v)}
          className={`clay-sm flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
            dropOpen ? "ring-2 ring-indigo-200" : ""
          }`}
          aria-haspopup="listbox"
          aria-expanded={dropOpen}
        >
          <span className="clay-icon h-9 w-9 shrink-0 bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white">
            {activeWorkspace ? workspaceInitial(activeWorkspace.name) : "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-slate-800">
              {activeWorkspace?.name ?? "Select workspace"}
            </span>
            <span className="block text-[11px] font-semibold capitalize text-indigo-400">
              {activeWorkspace?.member_role ?? "No workspace"}
            </span>
          </span>
          <ChevronsUpDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropOpen && (
          <div
            role="listbox"
            className="clay anim-pop-in absolute inset-x-0 top-full z-30 mt-2 overflow-hidden !rounded-2xl p-1.5"
          >
            <div className="max-h-52 overflow-y-auto">
              {workspaces.map((w) => {
                const active = w.id === activeWorkspace?.id;
                return (
                  <button
                    key={w.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelectWorkspace(w.id);
                      setDropOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                      active ? "bg-indigo-50" : "hover:bg-indigo-50/60"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        active
                          ? "bg-gradient-to-br from-indigo-400 to-violet-500 text-white"
                          : "bg-white/70 text-slate-500"
                      }`}
                    >
                      {workspaceInitial(w.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {w.name}
                      </span>
                      <span className="block text-[11px] capitalize text-slate-400">
                        {w.member_role}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-indigo-500" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 border-t border-indigo-100/70 pt-1">
              <button
                onClick={() => {
                  setDropOpen(false);
                  onCreateWorkspace();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/70">
                  <Plus className="h-4 w-4" />
                </span>
                Create workspace
              </button>
              {canManageWorkspace && (
                <button
                  onClick={() => {
                    setDropOpen(false);
                    onWorkspaceSettings();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-slate-500 transition hover:bg-indigo-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70">
                    <Settings className="h-4 w-4" />
                  </span>
                  Workspace settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          Menu
        </p>
        <ul className="space-y-1">
          {visibleNavs.map((item) => {
            const active = item.key === activeNav;
            return (
              <li key={item.key}>
                <Link
                  href={NAV_HREF[item.key]}
                  onClick={onCloseMobile}
                  className={`clay-nav flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold outline-none ${
                    active
                      ? "clay-nav-active"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${active ? "text-white" : item.tint}`}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Invite */}
      {canInvite && (
        <button
          onClick={onInvite}
          className="clay-btn flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-indigo-600"
        >
          <UserPlus className="h-4 w-4" />
          Invite teammate
        </button>
      )}
    </div>
  );
}

export default function Sidebar({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onWorkspaceSettings,
  onInvite,
  mobileOpen,
  onCloseMobile,
  hiddenNavs = [],
  canInvite = true,
  canManageWorkspace = true,
}: SidebarProps) {
  const bodyProps = {
    workspaces,
    activeWorkspace,
    onSelectWorkspace,
    onCreateWorkspace,
    onWorkspaceSettings,
    onInvite,
    onCloseMobile,
    hiddenNavs,
    canInvite,
    canManageWorkspace,
  };
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-72 shrink-0 lg:block">
        <SidebarBody {...bodyProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="anim-fade-in fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#f2f1fc] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <SidebarBody {...bodyProps} />
      </aside>
    </>
  );
}