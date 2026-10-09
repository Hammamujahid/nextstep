"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  MailPlus,
} from "lucide-react";
import { useDashboard } from "./DashboardProvider";
import type { ApiApplication, ApiTask } from "../../lib/dashboardApi";

type NotificationsBellProps = {
  tasks: ApiTask[];
  applications: ApiApplication[];
};

type Item = {
  key: string;
  icon: typeof Bell;
  iconCls: string;
  title: string;
  detail: string;
  href: string | null;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsBell({
  tasks,
  applications,
}: NotificationsBellProps) {
  const router = useRouter();
  const { myInvitations, openMyInvites } = useDashboard();
  const [open, setOpen] = useState(false);

  const items = useMemo<Item[]>(() => {
    const today = startOfToday();
    const open_ = tasks.filter((t) => t.status !== "completed");
    const overdue = open_
      .filter((t) => t.due_date && new Date(t.due_date) < today)
      .sort((a, b) => +new Date(a.due_date as string) - +new Date(b.due_date as string))
      .slice(0, 3)
      .map<Item>((t) => ({
        key: `overdue-${t.id}`,
        icon: AlertCircle,
        iconCls: "text-red-500",
        title: t.title,
        detail: `Overdue · due ${fmtDate(t.due_date as string)}`,
        href: "/dashboard/tasks",
      }));
    const dueToday = open_
      .filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      })
      .slice(0, 3)
      .map<Item>((t) => ({
        key: `today-${t.id}`,
        icon: CalendarClock,
        iconCls: "text-sky-500",
        title: t.title,
        detail: `Due today · ${fmtTime(t.due_date as string)}`,
        href: "/dashboard/tasks",
      }));
    const interviews = applications
      .filter((a) => a.status === "interviewing")
      .slice(0, 3)
      .map<Item>((a) => ({
        key: `interview-${a.id}`,
        icon: Briefcase,
        iconCls: "text-emerald-500",
        title: `${a.job_title} · ${a.company_name}`,
        detail: "Interviewing",
        href: "/dashboard/applications",
      }));
    const invites = myInvitations.map<Item>((inv) => ({
      key: `invite-${inv.id}`,
      icon: MailPlus,
      iconCls: "text-amber-500",
      title: `Invited to ${inv.workspace_name}`,
      detail: "Tap to review invitation",
      href: null,
    }));
    return [...overdue, ...dueToday, ...interviews, ...invites];
  }, [tasks, applications, myInvitations]);

  function select(item: Item) {
    setOpen(false);
    if (item.href === null) {
      openMyInvites();
    } else {
      router.push(item.href);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
          open
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Bell className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
        )}
      </button>
      {open && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="anim-pop-in absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto clay p-1.5 shadow-xl">
            <p className="px-3 pb-1 pt-2 text-sm font-bold text-slate-900">
              Notifications
            </p>
            {items.length === 0 ? (
              <p className="flex items-center gap-2 px-3 py-6 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                All clear. Nothing needs attention.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => select(item)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.iconCls}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.detail}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
