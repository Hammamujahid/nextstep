"use client";

import { useMemo, useState } from "react";
import { GitBranch, Terminal } from "lucide-react";
import ProjectsHeader from "./ProjectsHeader";
import ProjectsStats from "./ProjectsStats";
import ProjectsFilterBar, {
  type ProjectStatusFilter,
  type ProjectsViewMode,
} from "./ProjectsFilterBar";
import ProjectsGrid from "./ProjectsGrid";
import ProjectsTable from "./ProjectsTable";
import NewProjectModal, { type NewProjectInput } from "./NewProjectModal";
import {
  PROJECTS_BOARD,
  type ProjectItem,
  type SpecItemState,
} from "../../lib/dashboard";

let nextProjectId = 100;

export default function ProjectsView() {
  const [projects, setProjects] = useState<ProjectItem[]>(PROJECTS_BOARD);
  const [status, setStatus] = useState<ProjectStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ProjectsViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSynced(false);
    window.setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      window.setTimeout(() => setSynced(false), 2500);
    }, 1200);
  }

  function addProject(input: NewProjectInput) {
    nextProjectId += 1;
    setProjects((prev) => [
      {
        id: nextProjectId,
        name: input.name,
        tagline: input.description || "New build in continuous development.",
        description: input.description || "New build in continuous development.",
        status: input.status,
        stack: input.stack,
        progress: input.status === "completed" ? 100 : 0,
        progressMeta: input.status === "completed" ? "Shipped" : "Just started",
        updatedLabel: "Just now",
        version: null,
        commit: null,
        lighthouse: null,
        buildState: null,
        passingTests: null,
        openSource: false,
        checklist: null,
        scopeLabel: null,
        throughput: null,
        finalScore: null,
        shippedLabel: null,
        sparkline: [],
      },
      ...prev,
    ]);
    setStatus("all");
    setQuery("");
  }

  function toggleChecklist(projectId: number, itemId: number) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId || !p.checklist) return p;
        return {
          ...p,
          checklist: p.checklist.map((item) => {
            if (item.id !== itemId) return item;
            const next: SpecItemState =
              item.state === "done" ? "todo" : "done";
            return { ...item, state: next };
          }),
        };
      })
    );
  }

  const counts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = projects.filter((p) => {
      if (!q) return true;
      const haystack = `${p.name} ${p.stack.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
    const count = (s: ProjectStatusFilter) =>
      s === "all" ? searched.length : searched.filter((p) => p.status === s).length;
    return {
      all: count("all"),
      "in-progress": count("in-progress"),
      polish: count("polish"),
      planning: count("planning"),
      completed: count("completed"),
    };
  }, [projects, query]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      const haystack = `${p.name} ${p.stack.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, status, query]);

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <ProjectsHeader
        syncing={syncing}
        synced={synced}
        onSync={handleSync}
        onNew={() => setModalOpen(true)}
      />
      <ProjectsStats projects={projects} />
      <ProjectsFilterBar
        status={status}
        onStatusChange={setStatus}
        query={query}
        onQueryChange={setQuery}
        mode={mode}
        onModeChange={setMode}
        counts={counts}
      />
      {mode === "grid" ? (
        <ProjectsGrid projects={visible} onToggleChecklist={toggleChecklist} />
      ) : (
        <ProjectsTable projects={visible} />
      )}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sky-600">
            <GitBranch className="h-7 w-7" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">
              Connect External Git Provider
            </p>
            <p className="text-[13px] text-slate-500">
              Sync active PRs, issues, and commit messages straight into your
              weekly NextStep career milestones.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-4 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
            <Terminal className="h-[18px] w-[18px]" />
            GitHub CLI
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-4 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
            Configure Webhooks
          </button>
        </div>
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addProject}
      />
    </div>
  );
}
