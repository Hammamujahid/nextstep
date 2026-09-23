"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import SearchBar from "./SearchBar";
import NotificationsBell from "./NotificationsBell";
import {
  fetchApplications,
  fetchTasks,
  type ApiApplication,
  type ApiTask,
} from "../../lib/dashboardApi";

export type TopbarUser = {
  username: string;
  email: string;
  photo: string | null;
};

type TopbarProps = {
  title?: string;
  subtitle?: string;
  user: TopbarUser;
  loggingOut: boolean;
  onLogout: () => void;
  onSettings: () => void;
  onOpenMobile: () => void;
};

function userInitial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

function Avatar({ user, size }: { user: TopbarUser; size: "md" | "lg" }) {
  const cls = size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-sm";
  if (user.photo) {
    return (
      <Image
        src={user.photo}
        alt={user.username || "Profile photo"}
        width={44}
        height={44}
        className={`${cls} shrink-0 rounded-full object-cover ring-2 ring-sky-100`}
      />
    );
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white`}
    >
      {userInitial(user.username || "?")}
    </span>
  );
}

function useDismiss() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return [ref, open, setOpen] as const;
}

export default function Topbar({
  title,
  subtitle,
  user,
  loggingOut,
  onLogout,
  onSettings,
  onOpenMobile,
}: TopbarProps) {
  const [accountRef, accountOpen, setAccountOpen] = useDismiss();
  const { active } = useDashboard();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);

  const activeId = active?.id ?? null;

  // data real untuk pill interview + bel notifikasi
  useEffect(() => {
    if (activeId == null) {
      setTasks([]);
      setApplications([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchTasks(activeId).catch(() => [] as ApiTask[]),
      fetchApplications(activeId).catch(() => [] as ApiApplication[]),
    ]).then(([t, a]) => {
      if (cancelled) return;
      setTasks(t ?? []);
      setApplications(a ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const interviewCount = applications.filter(
    (a) => a.status === "interviewing"
  ).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMobile}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {title ? (
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {interviewCount > 0 && (
        <Link
          href="/dashboard/applications"
          className="hidden shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 transition hover:bg-slate-200 xl:flex"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {interviewCount} interview{interviewCount > 1 ? "s" : ""} in progress
          </span>
        </Link>
      )}

      <SearchBar workspaceId={activeId} />

      <NotificationsBell tasks={tasks} applications={applications} />

      <div ref={accountRef} className="relative ml-auto shrink-0">        <button
          onClick={() => setAccountOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-xl p-1 pr-1 transition hover:bg-slate-100 sm:pr-2"
        >
          <Avatar user={user} size="md" />
          <span className="hidden text-left md:block">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-slate-900">
              <span className="max-w-24 truncate">
                {user.username || "Account"}
              </span>
            </span>
            <span className="block max-w-32 truncate text-[11px] leading-tight text-slate-500">
              {user.email || "-"}
            </span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>

        {accountOpen && (
          <div
            role="menu"
            className="anim-pop-in absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <Avatar user={user} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user.username || "Account"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user.email || "-"}
                </p>
              </div>
            </div>
            <div className="p-1.5">
              <button
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  onSettings();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false);
                  onLogout();
                }}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
