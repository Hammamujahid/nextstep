"use client";

import { useState } from "react";
import HeroHeader from "./HeroHeader";
import PrimaryGoalCard from "./PrimaryGoalCard";
import MetricsGrid from "./MetricsGrid";
import NextSteps from "./NextSteps";
import ProjectsPanel from "./ProjectsPanel";
import ApplicationsPanel from "./ApplicationsPanel";
import GoalsSnapshot from "./GoalsSnapshot";
import FooterBanner from "./FooterBanner";
import QuickAddModal, { type QuickTaskInput } from "./QuickAddModal";
import { INITIAL_TASKS, type DashboardTask } from "../../lib/dashboard";

type DashboardHomeProps = {
  username: string;
};

let nextTaskId = 100;

export default function DashboardHome({ username }: DashboardHomeProps) {
  const [tasks, setTasks] = useState<DashboardTask[]>(INITIAL_TASKS);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  function toggleTask(id: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function addTask(input: QuickTaskInput) {
    nextTaskId += 1;
    setTasks((prev) => [{ id: nextTaskId, done: false, ...input }, ...prev]);
  }

  return (
    <div className="anim-fade-up flex w-full flex-col gap-6">
      <HeroHeader username={username} onNewTask={() => setQuickAddOpen(true)} />
      <PrimaryGoalCard />
      <MetricsGrid />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <NextSteps
            tasks={tasks}
            onToggle={toggleTask}
            onAdd={() => setQuickAddOpen(true)}
          />
          <ProjectsPanel />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ApplicationsPanel />
          <GoalsSnapshot />
        </div>
      </div>

      <FooterBanner />

      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={addTask}
      />
    </div>
  );
}
