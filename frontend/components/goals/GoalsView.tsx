"use client";

import { useMemo, useState } from "react";
import GoalsHeader from "./GoalsHeader";
import GoalsStats from "./GoalsStats";
import NorthStarCard from "./NorthStarCard";
import SupportingGoals, { type GoalSort } from "./SupportingGoals";
import RecommendationBanner from "./RecommendationBanner";
import NewGoalModal, { type NewGoalInput } from "./NewGoalModal";
import {
  SUPPORTING_GOALS,
  type SupportingGoal,
} from "../../lib/dashboard";

type TrackFilter = "all" | "complete" | "progress" | "pipeline";

const TRACK_FILTERS: { key: TrackFilter; label: string }[] = [
  { key: "all", label: "All Tracks" },
  { key: "complete", label: "Near Complete" },
  { key: "progress", label: "In Progress" },
  { key: "pipeline", label: "Active Pipeline" },
];

const TRACK_BADGE: Record<Exclude<TrackFilter, "all">, string> = {
  complete: "NEAR COMPLETE",
  progress: "IN PROGRESS",
  pipeline: "ACTIVE PIPELINE",
};

let nextGoalId = 100;

function formatTargetDate(iso: string): { label: string; month: number; day: number } {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { label: iso || "-", month: 12, day: 31 };
  }
  const label = parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
  return { label, month: parsed.getMonth() + 1, day: parsed.getDate() };
}

export default function GoalsView() {
  const [goals, setGoals] = useState<SupportingGoal[]>(SUPPORTING_GOALS);
  const [sort, setSort] = useState<GoalSort>("progress");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  function toggleChecklist(goalId: number, itemId: number) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          checklist: g.checklist.map((item) => {
            if (item.id !== itemId || item.locked) return item;
            return { ...item, done: !item.done };
          }),
        };
      })
    );
  }

  function addGoal(input: NewGoalInput) {
    nextGoalId += 1;
    const target = formatTargetDate(input.targetDate);
    setGoals((prev) => [
      {
        id: nextGoalId,
        title: input.title,
        description: input.category,
        badge: "NEW TRACK",
        badgeTone: "slate",
        icon: "server",
        progressLabel: "Proficiency",
        progress: 0,
        progressTone: "sky",
        tasksLabel: "0/0 Tasks",
        dateLabel: target.label,
        dateMonth: target.month,
        dateDay: target.day,
        status: "not_started",
        updatedAt: new Date().toISOString(),
        checklist: input.keyResult
          ? [{ id: 1, label: input.keyResult, done: false, locked: false }]
          : [],
      },
      ...prev,
    ]);
    setTrackFilter("all");
  }

  const visible = useMemo(() => {
    const rank: Record<SupportingGoal["status"], number> = {
      completed: 4,
      in_progress: 3,
      not_started: 2,
      archived: 1,
    };
    const filtered =
      trackFilter === "all"
        ? [...goals]
        : goals.filter((g) => g.badge === TRACK_BADGE[trackFilter]);
    if (sort === "progress") {
      filtered.sort((a, b) => {
        const ra = rank[a.status];
        const rb = rank[b.status];
        if (ra !== rb) return rb - ra;
        const ca = parseInt(a.tasksLabel.split("/")[0] || "0", 10);
        const cb = parseInt(b.tasksLabel.split("/")[0] || "0", 10);
        if (ca !== cb) return cb - ca;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } else if (sort === "deadline") {
      filtered.sort(
        (a, b) => a.dateMonth * 100 + a.dateDay - (b.dateMonth * 100 + b.dateDay)
      );
    } else {
      filtered.sort((a, b) => b.id - a.id);
    }
    return filtered;
  }, [goals, sort, trackFilter]);

  return (
    <div className="anim-fade-up flex w-full flex-col gap-5">
      <GoalsHeader
        onNewGoal={() => setModalOpen(true)}
        onToggleFilters={() => setFiltersVisible((v) => !v)}
        filtersVisible={filtersVisible}
      />
      {filtersVisible && (
        <div className="anim-slide-down flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Track status:</span>
          {TRACK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTrackFilter(f.key)}
              aria-pressed={trackFilter === f.key}
              className={`rounded-lg px-3 py-1.5 text-[13px] transition ${
                trackFilter === f.key
                  ? "bg-slate-800 font-semibold text-white shadow-sm"
                  : "bg-white font-medium text-slate-500 shadow-sm hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <GoalsStats />
      <NorthStarCard />
      <SupportingGoals
        goals={visible}
        sort={sort}
        onSortChange={setSort}
        onToggleChecklist={toggleChecklist}
      />
      {!snoozed && <RecommendationBanner onSnooze={() => setSnoozed(true)} />}
      <NewGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addGoal}
      />
    </div>
  );
}
