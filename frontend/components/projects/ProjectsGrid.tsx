"use client";

import { useState } from "react";
import {
  Bookmark,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  Cloud,
  EllipsisVertical,
  ExternalLink,
  Eye,
  FolderOpen,
  GitBranch,
  Globe,
  History,
  Link2,
  Terminal,
  TrendingUp,
} from "lucide-react";
import type { ProjectItem, SpecItemState } from "../../lib/dashboard";

const STATUS_BADGE: Record<ProjectItem["status"], string> = {
  polish: "bg-sky-100 text-sky-700",
  "in-progress": "bg-slate-100 text-sky-700",
  planning: "bg-slate-100 text-slate-500",
  completed: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABEL: Record<ProjectItem["status"], string> = {
  polish: "Polish Stage",
  "in-progress": "In Progress",
  planning: "Planning & Spec",
  completed: "Completed",
};

function StackTags({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {stack.map((s) => (
        <span
          key={s}
          className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-500"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: "sky" | "emerald" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          tone === "sky"
            ? "bg-gradient-to-r from-sky-400 to-sky-500"
            : "bg-gradient-to-r from-emerald-400 to-emerald-500"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

type GridProps = {
  projects: ProjectItem[];
  onToggleChecklist: (projectId: number, itemId: number) => void;
};

export default function ProjectsGrid({ projects, onToggleChecklist }: GridProps) {
  const [saved, setSaved] = useState<number[]>([]);

  function toggleSaved(id: number) {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">
          No projects match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
      {projects.map((p) => {
        if (p.status === "polish") {
          return (
            <FeaturedCard key={p.id} project={p} saved={saved.includes(p.id)} onSave={() => toggleSaved(p.id)} />
          );
        }
        if (p.status === "in-progress") {
          return <SideCard key={p.id} project={p} />;
        }
        if (p.status === "planning") {
          return (
            <PlanningCard key={p.id} project={p} onToggleChecklist={onToggleChecklist} />
          );
        }
        return <CompletedCard key={p.id} project={p} />;
      })}
    </div>
  );
}

function FeaturedCard({
  project: p,
  saved,
  onSave,
}: {
  project: ProjectItem;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-md lg:col-span-8">
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-sky-500 via-sky-400 to-slate-800">
        <div
          aria-hidden="true"
          className="anim-drift absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="anim-drift-late absolute -bottom-12 right-10 h-56 w-56 rounded-full bg-slate-900/30 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/60 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="h-2 w-2 rounded-full bg-sky-500" />
            </span>
            {STATUS_LABEL[p.status]}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-600 shadow-sm backdrop-blur transition hover:bg-white">
            <ExternalLink className="h-3.5 w-3.5" />
            Live Preview
          </span>
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1.5">
          <button
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? "Remove bookmark" : "Bookmark project"}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:text-sky-600"
          >
            <Bookmark
              className={`h-[18px] w-[18px] ${saved ? "fill-sky-400 text-sky-400" : ""}`}
            />
          </button>
          <button
            aria-label={`More options for ${p.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:text-slate-900"
          >
            <EllipsisVertical className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold tracking-tight text-slate-900">
              {p.name}
            </h3>
            <p className="truncate text-[13px] text-slate-600">{p.tagline}</p>
          </div>
          {p.commit && (
            <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1 font-mono text-xs text-slate-700 shadow-sm backdrop-blur sm:flex">
              <GitBranch className="h-4 w-4 text-emerald-600" />
              {p.commit}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Milestone Progression{" "}
              <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500">
                {p.progressMeta}
              </span>
            </p>
            <span className="text-lg font-bold text-sky-600">{p.progress}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={p.progress} tone="sky" />
          </div>
        </div>

        <StackTags stack={p.stack} />

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-[13px] text-slate-500">
            {p.lighthouse && (
              <span className="flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-emerald-500" />
                {p.lighthouse}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {p.updatedLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
              <Terminal className="h-4 w-4" />
              Open in Studio
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
              <Link2 className="h-4 w-4" />
              Repo
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SideCard({ project: p }: { project: ProjectItem }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6 lg:col-span-4">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span
            className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
          >
            {STATUS_LABEL[p.status]}
          </span>
          <button
            aria-label={`More options for ${p.name}`}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-2 flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sky-600">
            <Cloud className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-slate-900">
              {p.name}
            </h3>
            {p.version && (
              <span className="font-mono text-xs text-slate-500">{p.version}</span>
            )}
          </div>
        </div>
        <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
          {p.description}
        </p>
        <StackTags stack={p.stack} />
        <div className="mb-4 mt-4 rounded-xl bg-slate-50 p-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-slate-900">
              Queue Ingestion Benchmark
            </span>
            <span className="font-mono text-xs font-semibold text-sky-600">
              {p.progress}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={p.progress} tone="sky" />
          </div>
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <span>{p.progressMeta}</span>
            {p.passingTests && (
              <span className="text-emerald-600">{p.passingTests}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        {p.buildState ? (
          <span className="flex items-center gap-1.5 text-slate-500">
            <Check className="h-4 w-4 text-emerald-500" />
            {p.buildState}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-4 w-4" />
            {p.updatedLabel}
          </span>
        )}
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          Sprint Board
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}

function PlanningCard({
  project: p,
  onToggleChecklist,
}: {
  project: ProjectItem;
  onToggleChecklist: (projectId: number, itemId: number) => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6 lg:col-span-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
            >
              {STATUS_LABEL[p.status]}
            </span>
            {p.openSource && (
              <span className="flex items-center gap-1 font-mono text-xs text-emerald-600">
                <Globe className="h-3.5 w-3.5" />
                Open Source
              </span>
            )}
          </div>
          <button
            aria-label={`More options for ${p.name}`}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </div>
        <div className="my-2 flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sky-600">
            <Cloud className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              {p.description}
            </p>
          </div>
        </div>
        <div className="my-4">
          <StackTags stack={p.stack} />
        </div>
        {p.checklist && (
          <div className="mb-2 space-y-2">
            {p.checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => onToggleChecklist(p.id, item.id)}
                aria-pressed={item.state === "done"}
                className="flex w-full items-center gap-2 text-left text-[13px]"
              >
                <SpecDot state={item.state} />
                <span
                  className={
                    item.state === "done"
                      ? "text-slate-400 line-through"
                      : item.state === "active"
                        ? "font-medium text-slate-900"
                        : "text-slate-500"
                  }
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-[13px] text-slate-900">
          <span className="font-semibold">Scope Target: </span>
          <span className="font-mono text-xs text-sky-600">
            {p.scopeLabel ?? `${p.progress}% complete`}
          </span>
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
          <FolderOpen className="h-4 w-4" />
          View Architecture RFC
        </span>
      </div>
    </article>
  );
}

function SpecDot({ state }: { state: SpecItemState }) {
  if (state === "done") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-[12px] font-bold text-white">
        ✓
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-sky-100 text-[10px] text-sky-600">
        ●
      </span>
    );
  }
  return <span className="h-4 w-4 shrink-0 rounded bg-slate-100" />;
}

function CompletedCard({ project: p }: { project: ProjectItem }) {
  const max = Math.max(...p.sparkline, 1);
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6 lg:col-span-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
            >
              <Check className="h-3.5 w-3.5" />
              {STATUS_LABEL[p.status]}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
              Archived Demo
            </span>
          </div>
          <button
            aria-label={`More options for ${p.name}`}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </div>
        <div className="my-2 flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-600">
            <TrendingUp className="h-[22px] w-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              {p.description}
            </p>
          </div>
        </div>
        <div className="my-4">
          <StackTags stack={p.stack} />
        </div>
        <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
          <div>
            <p className="text-[11px] text-slate-500">Engine Throughput</p>
            <p className="mt-0.5 text-[15px] font-bold text-slate-900">
              {p.throughput ?? "-"}
            </p>
          </div>
          {p.sparkline.length > 0 && (
            <div
              className="flex h-8 w-28 items-end gap-1"
              aria-hidden="true"
            >
              {p.sparkline.map((v, i) => (
                <span
                  key={i}
                  className="w-2 rounded-t bg-sky-400/70 last:bg-sky-400"
                  style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%` }}
                />
              ))}
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Final Score</p>
            <p className="mt-0.5 text-[15px] font-bold text-emerald-600">
              {p.finalScore ?? "-"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
          <History className="h-4 w-4" />
          {p.shippedLabel ?? p.updatedLabel}
        </span>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
            <Eye className="h-4 w-4" />
            Case Study
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-200">
            <Eye className="h-4 w-4" />
            Demo Site
          </button>
        </div>
      </div>
    </article>
  );
}
