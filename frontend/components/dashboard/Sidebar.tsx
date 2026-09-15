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

export const NAV_ITEMS: { key: NavKey; label: string; icon: typeof Target }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "goals", label: "Goals", icon: Target },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "applications", label: "Job Applications", icon: Briefcase },
  { key: "members", label: "Members", icon: Users },
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
};

function workspaceInitial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
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
}: SidebarProps) {
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

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        <Logo />
        <button
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Section 1: Workspace */}
      <div className="px-3 pt-4">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <div ref={dropRef} className="relative mt-1.5">
          <button
            onClick={() => setDropOpen((v) => !v)}
            className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
              dropOpen
                ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
            }`}
            aria-haspopup="listbox"
            aria-expanded={dropOpen}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400 text-sm font-bold text-white">
              {activeWorkspace ? workspaceInitial(activeWorkspace.name) : "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {activeWorkspace?.name ?? "Select workspace"}
              </span>
              <span className="block text-xs capitalize text-slate-500">
                {activeWorkspace?.member_role ?? "No workspace"}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              title="Workspace settings"
              aria-label="Workspace settings"
              onClick={(e) => {
                e.stopPropagation();
                setDropOpen(false);
                onWorkspaceSettings();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropOpen(false);
                  onWorkspaceSettings();
                }
              }}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-100 hover:text-sky-600"
            >
              <Settings className="h-4 w-4" />
            </span>
            <ChevronsUpDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropOpen && (
            <div
              role="listbox"
              className="anim-pop-in absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="max-h-56 overflow-y-auto p-1.5">
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
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                        active ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          active
                            ? "bg-sky-400 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {workspaceInitial(w.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {w.name}
                        </span>
                        <span className="block text-xs capitalize text-slate-400">
                          {w.member_role}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-sky-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-1.5">
                <button
                  onClick={() => {
                    setDropOpen(false);
                    onCreateWorkspace();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-sky-600 transition hover:bg-sky-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-sky-300 bg-sky-50">
                    <Plus className="h-4 w-4" />
                  </span>
                  Create workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Navigation */}
      <nav className="mt-5 flex-1 overflow-y-auto px-3">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="mt-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeNav;
            return (
              <li key={item.key}>
                <Link
                  href={NAV_HREF[item.key]}
                  onClick={onCloseMobile}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${active ? "text-sky-600" : "text-slate-400"}`}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Section 3: Invite */}
      <div className="border-t border-slate-200/80 p-3">
        <button
          onClick={onInvite}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50/60 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
        >
          <UserPlus className="h-4 w-4" />
          Invite user
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white lg:block">
        {body}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="anim-fade-in fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        {body}
      </aside>
    </>
  );
}
