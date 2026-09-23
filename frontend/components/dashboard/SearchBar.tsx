"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FolderKanban,
  ListChecks,
  Search,
  Target,
} from "lucide-react";
import {
  fetchApplications,
  fetchGoals,
  fetchProjects,
  fetchTasks,
  type ApiApplication,
  type ApiProject,
  type ApiTask,
  type PrimaryGoal,
} from "../../lib/dashboardApi";

type SearchBarProps = {
  workspaceId: number | null;
};

type Hit = {
  key: string;
  title: string;
  meta: string;
  href: string;
};

const MAX_PER_GROUP = 5;

function pretty(s: string): string {
  return s.replace(/_/g, " ");
}

export default function SearchBar({ workspaceId }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // reset cache saat workspace berganti
  useEffect(() => {
    setFetched(false);
    setTasks([]);
    setGoals([]);
    setProjects([]);
    setApps([]);
  }, [workspaceId]);

  // ⌘K / Ctrl+K fokus ke search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // klik di luar menutup dropdown
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function ensureLoaded() {
    if (fetched || loading || workspaceId == null) return;
    setLoading(true);
    Promise.all([
      fetchTasks(workspaceId).catch(() => [] as ApiTask[]),
      fetchGoals(workspaceId).catch(() => [] as PrimaryGoal[]),
      fetchProjects(workspaceId).catch(() => [] as ApiProject[]),
      fetchApplications(workspaceId).catch(() => [] as ApiApplication[]),
    ])
      .then(([t, g, p, a]) => {
        setTasks(t ?? []);
        setGoals(g ?? []);
        setProjects(p ?? []);
        setApps(a ?? []);
        setFetched(true);
      })
      .finally(() => setLoading(false));
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taskHits: Hit[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((t) => ({
        key: `task-${t.id}`,
        title: t.title,
        meta: `${t.priority} · ${pretty(t.status)}`,
        href: "/dashboard/tasks",
      }));
    const goalHits: Hit[] = goals
      .filter((g) => g.title.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((g) => ({
        key: `goal-${g.id}`,
        title: g.title,
        meta: `${g.progress}% · ${pretty(g.status)}`,
        href: "/dashboard/goals",
      }));
    const projectHits: Hit[] = projects
      .filter((p) => p.project_name.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        key: `project-${p.id}`,
        title: p.project_name,
        meta: pretty(p.status),
        href: "/dashboard/projects",
      }));
    const appHits: Hit[] = apps
      .filter(
        (a) =>
          a.job_title.toLowerCase().includes(q) ||
          a.company_name.toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({
        key: `app-${a.id}`,
        title: `${a.job_title} · ${a.company_name}`,
        meta: pretty(a.status),
        href: "/dashboard/applications",
      }));
    return [
      { label: "Tasks", icon: ListChecks, hits: taskHits },
      { label: "Goals", icon: Target, hits: goalHits },
      { label: "Projects", icon: FolderKanban, hits: projectHits },
      { label: "Applications", icon: Briefcase, hits: appHits },
    ].filter((g) => g.hits.length > 0);
  }, [query, tasks, goals, projects, apps]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-xs">
      <Search className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search goals, applications, companies..."
        aria-label="Search"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          ensureLoaded();
          setOpen(true);
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
      />
      <kbd className="pointer-events-none absolute right-3 rounded bg-slate-200/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
        ⌘K
      </kbd>

      {showDropdown && (
        <div className="anim-pop-in absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              Searching...
            </p>
          ) : groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              No results for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <g.icon className="h-3.5 w-3.5" />
                  {g.label}
                </p>
                {g.hits.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => go(h.href)}
                    className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {h.title}
                    </span>
                    <span className="block truncate text-xs capitalize text-slate-500">
                      {h.meta}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
