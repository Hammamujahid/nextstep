/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import AddApplicationModal, {
  type NewApplicationInput,
} from "./AddApplicationModal";
import EditApplicationModal, {
  type EditApplicationInput,
} from "./EditApplicationModal";
import { useDashboard } from "../dashboard/DashboardProvider";
import AccessDenied from "../ui/AccessDenied";
import RowActionMenu from "../ui/RowActionMenu";
import { canEdit as canEditPerm, canRead as canReadPerm } from "../../lib/permissions";
import {
  fetchApplications,
  fetchAssignableMembers,
  createApplication,
  updateApplicationApi,
  deleteApplicationApi,
  type ApiApplication,
  type ApplicationStatus,
  type AssignableMember,
} from "../../lib/dashboardApi";
import { connectWorkspaceEvents } from "../../lib/sse";
import AssigneeSelect from "../ui/AssigneeSelect";
import InlineSelect from "../ui/InlineSelect";
import DueDateSelect from "../ui/DueDateSelect";

type ViewMode = "pipeline" | "list";
type StatusFilter = ApplicationStatus | "all";
type SortKey = "newest" | "oldest" | "company";

const PIPELINE: { value: ApplicationStatus; label: string }[] = [
  { value: "wishlist", label: "Wishlist" },
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "interviewing", label: "Interview" },
  { value: "offered", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

function statusLabel(s: ApplicationStatus): string {
  return PIPELINE.find((p) => p.value === s)?.label ?? s;
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-100 text-slate-500",
  applied: "bg-blue-50 text-blue-500",
  under_review: "bg-purple-50 text-purple-500",
  interviewing: "bg-orange-50 text-orange-500",
  offered: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-500",
};

const STATUS_DOT: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-400",
  applied: "bg-blue-500",
  under_review: "bg-purple-500",
  interviewing: "bg-orange-500",
  offered: "bg-emerald-500",
  rejected: "bg-red-500",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(company: string): string {
  return company
    .replace(/^PT\s+/i, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function ApplicationsView() {
  const { active, myRole, perms, permsLoading } = useDashboard();
  const readable = canReadPerm(myRole, perms, "job_application");
  const editable = canEditPerm(myRole, perms, "job_application");
  const activeId = active?.id;
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [assignees, setAssignees] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("pipeline");
  const [sort, setSort] = useState<SortKey>("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApiApplication | null>(null);

  const fetchData = async (withLoading = true) => {
    if (!active) return;
    if (withLoading) setLoading(true);
    try {
      const data = await fetchApplications(active.id).catch(() => [] as ApiApplication[]);
      setApps(data ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetchApplications(activeId)
      .then((data) => {
        if (cancelled) return;
        setApps(data ?? []);
        setError(null);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Failed to load applications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchAssignableMembers(activeId, "job_application")
      .then((data) => {
        if (!cancelled) setAssignees(data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const disconnect = connectWorkspaceEvents(activeId, (ev) => {
      if (ev.type === "application_created" || ev.type === "application_updated" || ev.type === "application_deleted") {
        void fetchData(false);
      }
    });
    return () => disconnect();
  }, [activeId]);

  async function addApplication(input: NewApplicationInput) {
    if (!active) return;
    try {
      await createApplication(active.id, {
        job_title: input.jobTitle,
        company_name: input.companyName,
        status: "wishlist",
        due_date: input.dueDateISO,
        job_url: input.jobUrl || null,
        assignee_id: input.assigneeId,
      });
      await fetchData();
    } catch (e) {
      console.error("create application failed", e);
    }
    setStatusFilter("all");
  }

  async function handleStatusChange(id: number, status: ApplicationStatus) {
    if (!active) return;
    const target = apps.find((a) => a.id === id);
    if (!target || target.status === status) return;
    const prev = apps;
    setApps((list) => list.map((a) => (a.id !== id ? a : { ...a, status })));
    try {
      await updateApplicationApi(active.id, id, { status });
      await fetchData();
    } catch (e) {
      console.error("update application status failed", e);
      setApps(prev);
    }
  }

  async function handleAssigneeChange(id: number, assigneeId: number | null) {
    if (!active) return;
    const target = apps.find((a) => a.id === id);
    if (!target || (target.assignee_id ?? null) === assigneeId) return;
    const prev = apps;
    const nextName =
      assigneeId != null
        ? (assignees.find((a) => a.user_id === assigneeId)?.username ?? target.assignee?.username ?? null)
        : null;
    setApps((list) =>
      list.map((a) =>
        a.id !== id
          ? a
          : {
              ...a,
              assignee_id: assigneeId,
              assignee:
                assigneeId != null
                  ? {
                      id: assigneeId,
                      username: nextName ?? "",
                      email:
                        assignees.find((x) => x.user_id === assigneeId)?.email ??
                        target.assignee?.email ??
                        "",
                    }
                  : null,
            }
      )
    );
    try {
      await updateApplicationApi(
        active.id,
        id,
        assigneeId == null ? { clear_assignee_id: true } : { assignee_id: assigneeId }
      );
      await fetchData();
    } catch (e) {
      console.error("update assignee failed", e);
      setApps(prev);
    }
  }

  async function handleDueChange(id: number, dueDateISO: string | null) {
    if (!active) return;
    const target = apps.find((a) => a.id === id);
    if (!target) return;
    const cur = target.due_date ? new Date(target.due_date).getTime() : null;
    const next = dueDateISO ? new Date(dueDateISO).getTime() : null;
    if (next === cur) return;
    try {
      if (dueDateISO == null) {
        await updateApplicationApi(active.id, id, { due_date: null, clear_due_date: true });
      } else {
        await updateApplicationApi(active.id, id, { due_date: dueDateISO });
      }
      await fetchData();
    } catch (e) {
      console.error("update due date failed", e);
    }
  }

  async function handleEditSave(input: EditApplicationInput) {
    if (!active || !editingApp) return;
    const target = editingApp;
    const targetId = target.id;
    const prev = apps;
    // aturan edit applications: modal hanya untuk title, company name, url;
    // status, due date, assignee lewat dropdown inline
    const patch: {
      job_title?: string;
      company_name?: string;
      job_url?: string | null;
    } = {};
    if (input.jobTitle !== target.job_title) patch.job_title = input.jobTitle;
    if (input.companyName !== target.company_name) patch.company_name = input.companyName;
    if ((input.jobUrl || null) !== (target.job_url ?? null)) patch.job_url = input.jobUrl || null;
    setEditingApp(null);
    if (Object.keys(patch).length === 0) return;
    setApps((list) =>
      list.map((a) =>
        a.id !== targetId
          ? a
          : {
              ...a,
              job_title: input.jobTitle,
              company_name: input.companyName,
              job_url: input.jobUrl || null,
            }
      )
    );
    try {
      await updateApplicationApi(active.id, targetId, patch);
      await fetchData();
    } catch (e) {
      console.error("update application failed", e);
      setApps(prev);
    }
  }
  async function handleDelete(id: number) {
    if (!active) return;
    const prev = apps;
    setApps((list) => list.filter((a) => a.id !== id));
    try {
      await deleteApplicationApi(active.id, id);
      await fetchData();
    } catch (e) {
      console.error("delete application failed", e);
      setApps(prev);
    }
  }

  const summary = useMemo(() => {
    const activeCount = apps.filter((a) =>
      ["wishlist", "applied", "under_review", "interviewing"].includes(a.status)
    ).length;
    const offers = apps.filter((a) => a.status === "offered").length;
    return { total: apps.length, active: activeCount, offers };
  }, [apps]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = apps.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.company_name.toLowerCase().includes(q) ||
        a.job_title.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else if (sort === "oldest") {
      sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    } else {
      sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }
    return sorted;
  }, [apps, search, statusFilter, sort]);

  const upcoming = useMemo(
    () =>
      [...apps]
        .filter((a) => a.due_date)
        .sort((a, b) => +new Date(a.due_date as string) - +new Date(b.due_date as string))
        .slice(0, 4),
    [apps]
  );

  if (!permsLoading && !readable) {
    return <AccessDenied resource="Job Applications" />;
  }

  if (loading || permsLoading) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="h-24 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white p-5 shadow-sm" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white p-6 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-fade-up flex w-full flex-col gap-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">Gagal load applications</p>
          <p className="text-xs text-red-500">{error}</p>
          <button onClick={() => void fetchData()} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <BriefcaseBusiness size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Job Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your applications and manage your job search.
            </p>
          </div>
        </div>
        {editable && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            <Plus size={18} />
            Add Application
          </button>
        )}
      </section>

      {/* JOB SEARCH + UPCOMING */}
      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 p-6">
          <p className="text-lg font-bold text-slate-800">Your Job Search</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Keep your applications organized and follow up at the right time.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { value: String(summary.total), label: "Applications" },
              { value: String(summary.active), label: "Active" },
              { value: String(summary.offers), label: "Offer" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white bg-white/70 p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{s.value}</p>
                <p className="mt-1 text-[9px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Upcoming Activities</h2>
              <p className="mt-1 text-xs text-slate-400">Things you need to follow up.</p>
            </div>
            <CalendarDays size={20} className="shrink-0 text-blue-500" />
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-400">No upcoming deadlines.</p>
            )}
            {upcoming.map((a) => {
              const d = new Date(a.due_date as string);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50">
                    <span className="text-[9px] font-semibold uppercase text-blue-500">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-sm font-bold leading-none text-blue-600">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-700">{a.job_title}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-400">{a.company_name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-medium ${STATUS_STYLE[a.status]}`}>
                    {statusLabel(a.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
              placeholder="Search company, position..."
              aria-label="Search applications"
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
              >
                <option value="all">All Status</option>
                {PIPELINE.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>
            {(search || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                Reset
              </button>
            )}
            <div className="ml-2 flex rounded-xl border border-slate-200 p-1">
              <button
                onClick={() => setView("pipeline")}
                aria-label="Pipeline view"
                className={`rounded-lg p-2 transition ${view === "pipeline" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`rounded-lg p-2 transition ${view === "list" ? "bg-blue-50 text-blue-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section>
        {view === "pipeline" ? (
          <div className="overflow-x-auto pb-3">
            <div className="grid min-w-[1200px] grid-cols-6 gap-4">
              {PIPELINE.map((col) => {
                const columnApps = visible.filter((a) => a.status === col.value);
                return (
                  <div key={col.value} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[col.value]}`} />
                        <h2 className="truncate text-sm font-bold text-slate-900">{col.label}</h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                          {columnApps.length}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {columnApps.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 text-xs font-bold text-blue-500">
                              {initials(a.company_name)}
                            </span>
                            {editable && (
                              <RowActionMenu
                                label={`${a.job_title} at ${a.company_name}`}
                                onEdit={() => setEditingApp(a)}
                                onDelete={() => void handleDelete(a.id)}
                              />
                            )}
                          </div>
                          <h3 className="mt-3 truncate text-sm font-semibold text-slate-800">{a.job_title}</h3>
                          <p className="mt-1 truncate text-xs font-medium text-slate-500">{a.company_name}</p>
                          {a.job_url && (
                            <a
                              href={a.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={a.job_url}
                              aria-label={`View job posting for ${a.job_title}`}
                              className="mt-0.5 block truncate text-[11px] text-blue-500 transition hover:text-blue-600 hover:underline"
                            >
                              {a.job_url}
                            </a>
                          )}
                          <div className="mt-2">
                            <AssigneeSelect
                              assigneeId={a.assignee_id ?? null}
                              assigneeName={a.assignee?.username}
                              assignees={assignees.map((x) => ({ id: x.user_id, name: x.username }))}
                              onChange={(next) => void handleAssigneeChange(a.id, next)}
                              canEdit={editable}
                              label={`Change assignee of ${a.job_title}`}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <DueDateSelect
                              valueISO={a.due_date ?? null}
                              display={fmtDate(a.due_date)}
                              onChange={(next) => void handleDueChange(a.id, next)}
                              canEdit={editable}
                              label={`Change due date of ${a.job_title}`}
                            />
                          </div>
                        </div>
                      ))}
                      {editable && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-xs text-slate-400 transition hover:border-blue-300 hover:text-blue-500"
                        >
                          <Plus size={15} />
                          Add Application
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">All Applications</h2>
                  <p className="mt-1 text-xs text-slate-400">{visible.length} applications found</p>
                </div>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Sort applications"
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-500 outline-none transition focus:border-blue-400"
                  >
                    <option value="newest">Sort by: Newest</option>
                    <option value="oldest">Sort by: Oldest</option>
                    <option value="company">Sort by: Company</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {visible.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search size={20} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">No applications found</p>
                  <p className="mt-1 text-xs text-slate-400">Try another search or filter.</p>
                </div>
              ) : (
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs text-slate-400">
                      <th className="px-5 py-4 font-medium">Company</th>
                      <th className="px-4 py-4 font-medium">Position</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Due Date</th>
                      <th className="px-4 py-4 font-medium">Applied</th>
                      <th className="px-4 py-4 font-medium">Assignee</th>
                      <th className="w-12 px-4 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 text-xs font-bold text-blue-500">
                              {initials(a.company_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{a.company_name}</p>
                              {a.job_url && (
                                <a
                                  href={a.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={a.job_url}
                                  aria-label={`View job posting for ${a.job_title}`}
                                  className="mt-0.5 block max-w-48 truncate text-[11px] text-blue-500 transition hover:text-blue-600 hover:underline"
                                >
                                  {a.job_url}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-48 truncate px-4 py-4 text-sm text-slate-700">{a.job_title}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {editable ? (
                            <InlineSelect
                              value={a.status}
                              options={PIPELINE.map((s) => ({
                                value: s.value,
                                label: s.label,
                                dot: STATUS_DOT[s.value],
                              }))}
                              onChange={(v) => void handleStatusChange(a.id, v as ApplicationStatus)}
                              label={`Change status of ${a.job_title}`}
                              buttonClassName={`rounded-full py-1 pl-2.5 pr-1.5 text-[10px] font-medium outline-none transition ${STATUS_STYLE[a.status]}`}
                            />
                          ) : (
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLE[a.status]}`}>
                              {statusLabel(a.status)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                          <DueDateSelect
                            valueISO={a.due_date ?? null}
                            display={a.due_date ? fmtDate(a.due_date) : "No date"}
                            onChange={(next) => void handleDueChange(a.id, next)}
                            canEdit={editable}
                            label={`Change due date of ${a.job_title}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                          {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <AssigneeSelect
                            assigneeId={a.assignee_id ?? null}
                            assigneeName={a.assignee?.username}
                            assignees={assignees.map((x) => ({ id: x.user_id, name: x.username }))}
                            onChange={(next) => void handleAssigneeChange(a.id, next)}
                            canEdit={editable}
                            label={`Change assignee of ${a.job_title}`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          {editable && (
                            <RowActionMenu
                              label={`${a.job_title} at ${a.company_name}`}
                              onEdit={() => setEditingApp(a)}
                              onDelete={() => void handleDelete(a.id)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </section>

      <AddApplicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addApplication}
        assignees={assignees.map((a) => ({ id: a.user_id, name: a.username }))}
      />
      {editingApp && (
        <EditApplicationModal
          key={editingApp.id}
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
