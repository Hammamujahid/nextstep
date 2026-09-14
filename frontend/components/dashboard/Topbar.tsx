"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { NOTIFICATIONS } from "../../lib/dashboard";

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
  const [bellRef, bellOpen, setBellOpen] = useDismiss();

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

      <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 xl:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-slate-700">
          3 interviews coming up this week
        </span>
      </div>

      <div className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-xs">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="search"
          placeholder="Search goals, applications, companies..."
          aria-label="Search"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
        />
        <kbd className="pointer-events-none absolute right-3 rounded bg-slate-200/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          ⌘K
        </kbd>
      </div>

      <div ref={bellRef} className="relative shrink-0">
        <button
          onClick={() => setBellOpen((v) => !v)}
          aria-label="Notifications"
          aria-expanded={bellOpen}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
            bellOpen
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-white" />
        </button>
        {bellOpen && (
          <div className="anim-pop-in absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <p className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
              Notifications
            </p>
            <ul className="max-h-72 overflow-y-auto p-1.5">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {n.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">{n.detail}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div ref={accountRef} className="relative shrink-0">
        <button
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
              <span className="rounded-full bg-sky-100 px-1.5 py-px text-[10px] font-bold text-sky-700">
                Pro
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
